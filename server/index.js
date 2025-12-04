const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const dotenv = require('dotenv');
const path = require('path');
const { Anthropic } = require('@anthropic-ai/sdk');

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(bodyParser.json());
// Serve static files from the React client build
app.use(express.static(path.join(__dirname, '../client/dist')));

// Initialize Anthropic client
// Note: The API key is retrieved from process.env.ANTHROPIC_API_KEY
let apiKey = process.env.ANTHROPIC_API_KEY || '';
// Remove any quotes or whitespace that might have been pasted
apiKey = apiKey.trim().replace(/^["']|["']$/g, '');

console.log('Debug: API Key loaded status:', !!apiKey);
console.log('Debug: API Key length:', apiKey.length);
if (apiKey.length > 10) {
    console.log('Debug: API Key prefix:', apiKey.substring(0, 10) + '...');
} else {
    console.log('Debug: API Key is too short or empty');
}

const anthropic = new Anthropic({
    apiKey: apiKey,
    baseURL: process.env.ANTHROPIC_BASE_URL || undefined
});

// Allow configurable model name for proxy compatibility
// const MODEL_NAME = process.env.CLAUDE_MODEL || "claude-3-5-sonnet";
const MODEL_NAME = "claude-haiku-4-5-20251001"; // User specified custom model
console.log('Debug: Using model:', MODEL_NAME);

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'Server is running' });
});

// Generate Scenario Endpoint
app.post('/api/generate-scenario', async (req, res) => {
    try {
        const { theme, difficulty } = req.body;

        if (!process.env.ANTHROPIC_API_KEY) {
            return res.status(500).json({ error: 'Missing API Key' });
        }

        let themeContext = '';
        let playerContext = '';
        let additionalJsonFields = '';

        // Randomize Sinner Rank for Path to Nowhere
        let playerRank = '';
        if (theme === 'path_to_nowhere') {
            const rand = Math.random();
            if (rand < 0.1) playerRank = '狂'; // S-equivalent
            else if (rand < 0.4) playerRank = '危'; // A-equivalent
            else playerRank = '普'; // B-equivalent
        }

        if (theme === 'cyberpunk_novel') {
            themeContext = `
        世界观参考小说《穿进赛博游戏后干掉boss成功上位》。
        背景：赛博朋克未来，世界分为七大区。
        核心元素：义体改造、财团统治、地下反抗军、傀儡城。
        玩家角色：可能是试图推翻"长老会"的反叛者，或者是意外穿越的游戏玩家。
        风格：黑暗、霓虹、高科技低生活、暴力美学。
        特殊设定：
        1. 你的目标是生存并在财团的追捕下完成任务。
        2. **道具系统**：场景中可能包含黑客工具、义体插件、武器、恢复剂等。
        `;
            additionalJsonFields = `
      "inventory": ["便携式终端", "基础破解芯片"],
      "status": "义体负荷正常"`;
        } else if (theme === 'path_to_nowhere') {
            themeContext = `
        世界观参考游戏《无期迷途》。
        
        【世界背景】
        狄斯城（DisCity）：殒星降临后，人类在内海附近建立的新城邦，是当今世界的文明中心。
        以锈河为界，西岸为异方晶采矿业中心，东岸为商业娱乐新区。
        
        【主要区域】
        1. **辛迪加（Syndicate）**：
           - 原称"西区"，随着采矿业凋零沦为非法组织藏身地
           - 暴力团伙自治，争斗与狂厄泛滥，恶性事件层出不穷
           - 社会发展状况正在逐渐恶化
           - 关键地标：彼岸诊所（最大的医疗救助机构）
        
        2. **新城（New City）**：
           - 市议会迁驻后成为最繁荣的城区
           - 秩序井然但暗流涌动，表面光鲜实则腐败
           - 高楼林立，霓虹闪烁，是权力与财富的象征
        
        3. **MBCC（米诺斯危机管理局）**：
           - 专门收容和控制禁闭者的秘密机构
           - 曾隶属于FAC，现由第九机关领导
           - 高科技监狱，有针对性地处理狂厄事件
        
        4. **白砂之海**：沙漠与荒野交界的边缘地带，散落着卫星城和聚落
        
        【核心元素】
        - **狂厄（Mania）**：一种神秘的精神侵蚀现象，会导致禁闭者失控暴走
        - **禁闭者（Sinners）**：拥有异能的特殊人类，分为普/危/狂三个等级
        - **异方晶**：稀有矿物，与狂厄和异能密切相关
        - **狂厄武器**：利用狂厄结晶制造的危险武器
        
        【重要组织与NPC】
        1. **彼岸诊所**：
           - 艾恩（主理人）：医术高超，有强硬的行医准则，想要治愈辛迪加，对狂厄武器深恶痛绝，对官方不信任
           - 安（护士长）：对患者有极高的责任感
        
        2. **帕尔马**：导致辛迪加狂厄武器泛滥的幕后黑手，研发狂厄结晶，参与多次狂厄事件
        
        3. **米诺斯局长**（特殊NPC）：
           - 拥有独一无二的"枷锁"能力，能阻止禁闭者狂厄化并束缚为己用
           - 性格温和坚韧，真诚对待每一位禁闭者
           - **仅在玩家生死关头（重伤濒死、狂厄失控）时有极低概率（5%）出现救场**
        
        【玩家角色】
        你是一名刚刚觉醒的【${playerRank}级禁闭者】。注意：玩家不是局长！
        你拥有异能（根据等级${playerRank}，能力强度不同），但使用过度会加深狂厄侵蚀。
        
        【当前处境】
        你正处于上述某个区域的危机之中（可能是帮派火拼、狂厄爆发、被通缉追捕、卷入组织阴谋等）。
        
        【特殊设定】
        1. 你的目标是生存和逃离当前困境。
        2. **道具系统**：场景中可能隐藏关键道具（狂厄抑制剂、门禁卡、简易武器、情报记录等）。
        3. **NPC互动**：可能遇到彼岸诊所成员、帕尔马特工、其他禁闭者、辛迪加帮派等。
        4. **狂厄机制**：过度使用异能会提高狂厄值，达到临界点可能失控。
        5. 文本风格要贴近原生游戏，注重逻辑性和沉浸感。
        `;
            playerContext = `玩家当前身份：${playerRank}级禁闭者。`;
            additionalJsonFields = `
      "player_rank": "${playerRank}",
      "inventory": [],
      "status": "正常"`;
        } else if (theme === 'chinese_folklore') {
            themeContext = `
        世界观参考《纸嫁衣》、《烟火》等中式民俗恐怖作品。
        背景：偏远闭塞的山村（如“封门村”、“葬铃村”），保留着诡异的封建迷信习俗。
        核心元素：纸人、冥婚、灵堂、戏班、五行八卦、阴阳眼、厉鬼索命。
        玩家角色：回乡奔丧的年轻人、调查失踪案的记者、或者是误入歧途的游客。
        特殊设定：
        1. 氛围恐怖压抑，强调心理恐惧。
        2. 你的目标是解开谜团并逃离村庄。
        3. **道具系统**：场景中可能包含风水道具（如：罗盘、桃木剑、符纸、朱砂）或线索物品。
        `;
            additionalJsonFields = `
      "inventory": ["老式手电筒"],
      "status": "惊魂未定"`;
        } else if (theme === 'tomb_raiding') {
            themeContext = `
        世界观参考《鬼吹灯》、《盗墓笔记》。
        背景：深埋地下的古代陵墓（如"精绝古城"、"秦岭神树"）。
        核心元素：机关陷阱、粽子（僵尸）、风水秘术、摸金校尉、冥器。
        玩家角色：经验丰富的摸金校尉，或者是考古队的向导。
        特殊设定：
        1. 强调探险与解谜，需要利用风水知识和专业工具。
        2. 你的目标是找到主墓室的宝藏并活着出去。
        3. **道具系统**：你随身携带探险装备（如：洛阳铲、黑驴蹄子、蜡烛、糯米）。
        `;
            additionalJsonFields = `
      "inventory": ["洛阳铲", "黑驴蹄子", "蜡烛", "糯米"],
      "status": "状态良好"`;
        } else if (theme === 'rule_horror') {
            themeContext = `
        世界观参考规则类怪谈、SCP基金会、后室(Backrooms)等。
        背景：一个看似普通但充满诡异规则的封闭空间（如：深夜便利店、废弃医院、诡异公寓、末班地铁、神秘酒店等）。
        
        核心元素：
        - 必须遵守的神秘规则（违反则死）
        - 看似正常实则扭曲的环境
        - 伪装成普通人的"它们"
        - 无法解释的超自然现象
        - 时间/空间异常
        
        玩家角色：误入异常空间的普通人。
        
        特殊设定：
        1. **规则系统**：游戏开始时，玩家会收到一份规则清单（3-5条）。这些规则必须严格遵守。
           规则示例：
           - "不要与穿红衣服的人说话"
           - "听到敲门声，数到10再开门"
           - "凌晨3点必须躲在被子里"
           - "不要相信镜子里的自己"
           - "如果有人问你的名字，告诉它错误的名字"
        2. 玩家的目标是在遵守规则的前提下找到逃离的方法。
        3. **道具系统**：场景中可能包含线索物品（如：残破的日记、神秘的符号、上一个受害者的遗物）。
        4. 氛围要阴森诡异，强调心理恐惧和规则悬念。
        5. 在description中必须包含3-5条清晰的规则，格式如：【规则1】xxx【规则2】xxx
        `;
            additionalJsonFields = `
      "inventory": ["手机（电量47%）", "钥匙"],
      "hints": ["【规则1】不要与穿红衣服的人说话", "【规则2】听到敲门声，数到10再开门", "【规则3】凌晨3点必须躲在被子里"],
      "status": "心跳加速"`;
        } else {
            themeContext = `主题：${theme || '神秘古宅'}`;
        }

        const prompt = `你是一个文字逃生游戏的上帝（Game Master）。
    请创建一个新的游戏场景。
    
    ${themeContext}
    难度：${difficulty || '普通'}
    
    请以 JSON 格式输出，结构如下：
    {
      "title": "场景标题",
      "description": "房间或情境的开场描述（请使用生动的中文描述，极具沉浸感，符合上述世界观）",
      "initial_options": ["选项1", "选项2", "选项3"]${theme === 'path_to_nowhere' ? ',' + additionalJsonFields : (theme === 'rule_horror' ? ',' + additionalJsonFields : '')}
    }
    不要包含 JSON 以外的任何文本。确保内容是中文的。`;

        const msg = await anthropic.messages.create({
            model: MODEL_NAME,
            max_tokens: 4000, // Increased to prevent truncation
            temperature: 0.8,
            system: "你是一个富有创造力的游戏上帝，擅长描写极具画面感和沉浸感的文字。专门为游戏引擎输出有效的 JSON 数据。请始终使用中文回复。严禁包含 markdown 格式（如 ```json），仅输出纯 JSON 文本。确保所有字符串中的双引号都已正确转义。",
            messages: [
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "text",
                            "text": prompt
                        }
                    ]
                }
            ]
        });

        const content = msg.content[0].text;
        console.log("Claude response length:", content.length);

        // Robust JSON extraction
        let cleanContent = content.trim();
        const firstOpenBrace = cleanContent.indexOf('{');
        const lastCloseBrace = cleanContent.lastIndexOf('}');

        if (firstOpenBrace !== -1 && lastCloseBrace !== -1) {
            cleanContent = cleanContent.substring(firstOpenBrace, lastCloseBrace + 1);
        } else if (cleanContent.startsWith('```')) {
            // Fallback to stripping markdown if braces not found nicely (unlikely for valid JSON)
            cleanContent = cleanContent.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
        }

        // Attempt to parse JSON to ensure validity
        try {
            const scenario = JSON.parse(cleanContent);
            // Ensure player_rank is set if it's path_to_nowhere (in case LLM missed it, though we force it in prompt, better to be safe or just trust the prompt)
            if (theme === 'path_to_nowhere' && !scenario.player_rank) {
                scenario.player_rank = playerRank;
                scenario.inventory = [];
                scenario.status = "正常";
            }
            // Ensure hints is initialized for rule_horror
            if (theme === 'rule_horror' && !scenario.hints) {
                scenario.hints = [];
            }
            // Ensure hints is initialized for rule_horror
            if (theme === 'rule_horror' && !scenario.hints) {
                scenario.hints = [];
            }
            res.json(scenario);
        } catch (e) {
            console.error("Failed to parse Claude response:", content);
            res.status(500).json({ error: 'Failed to generate valid scenario', raw: content });
        }

    } catch (error) {
        console.error('Error generating scenario:', error);
        res.status(500).json({ error: 'Internal server error', details: error.message });
    }
});

// Submit Action Endpoint
app.post('/api/submit-action', async (req, res) => {
    try {
        const { action, currentContext } = req.body;

        if (!process.env.ANTHROPIC_API_KEY) {
            return res.status(500).json({ error: 'Missing API Key' });
        }

        // Path to Nowhere specific logic for NPCs and Items
        let encounterPrompt = "";
        let npcOutputFormat = `
             【NPC信息输出格式】
             如果本回合有NPC出场或与玩家互动，请在JSON中返回npc_encounter数组：
             "npc_encounter": [
               {
                 "name": "NPC名称",
                 "title": "称号/职位",
                 "attitude": "友好/中立/敌对/警惕",
                 "description": "一句话描述该NPC的外貌或特征",
                 "dialogue": "NPC的台词（如果有）"
               }
             ]
             如果没有NPC出场，返回空数组 "npc_encounter": []
        `;

        if (currentContext.theme === 'path_to_nowhere') {
            encounterPrompt = `
             【特殊判定系统】
             1. **NPC 遭遇判定**（约25%概率触发）：
                请根据当前场景，随机安排**有特色的原创NPC**登场。
                
                **NPC设计要求**：
                - 每个NPC都要有独特的外貌特征（如伤疤、义肢、纹身、发色等）
                - 给NPC起一个有意味的名字或绰号（如"疯犬艾克"、"锈铁老六"、"白发伊芙"）
                - 描述NPC的态度和语气（冷漠、疯狂、狡猾、热心等）
                
                **优先使用以下组织/阵营的NPC**：
                
                A. **彼岸诊所成员**（如果在辛迪加或医疗相关场景）：
                   - 艾恩：男性，主理人，医术高超，冷静理性，对狂厄武器深恶痛绝
                   - 安：女性，护士长，温柔坚定，对患者有极高责任感
                
                B. **帕尔马组织**（如果涉及狂厄武器、阴谋）：
                   - 特工/研究员：冷酷专业，身穿黑色制服，携带狂厄武器
                
                C. **辛迪加帮派**：纹身满身的暴徒、精明的情报贩子
                
                D. **其他禁闭者**：普/危/狂级，各有特点
                
                E. **米诺斯局长**（特殊NPC）：
                   - **仅在玩家生死关头时有5%概率出现救场**
                   - 温和女性，拥有"枷锁"能力，能压制狂厄
             
             2. **道具获取判定**（约20%概率触发）：
                根据场景给予合适道具：
                - 辛迪加：狂厄抑制剂、简易武器、情报记录
                - 新城：门禁卡、伪造证件
                - 彼岸诊所：医疗用品、狂厄检测仪
             
             3. **狂厄值追踪**：
                - 如果玩家过度使用异能，在status中提示"狂厄侵蚀加深"
                - 接近临界点时，描述中要有明显的狂厄症状
             
             ${npcOutputFormat}
             `;
        } else if (currentContext.theme === 'cyberpunk_novel') {
            encounterPrompt = `
             【特殊判定系统】
             1. **NPC 遭遇判定**（约25%概率触发）：
                请设计有赛博朋克特色的原创NPC：
                - 义体改造者（描述其改造部位）
                - 黑客/网络入侵者（描述其装备和风格）
                - 企业特工（冷酷、专业）
                - 街头混混/赏金猎人
                
                **为每个NPC设计独特的外号和外貌特征**。
             
             2. **道具获取判定**（约20%概率触发）：
                如果玩家进行了探索或战斗，请给予符合场景的道具。
             
             ${npcOutputFormat}
             `;
        } else if (currentContext.theme === 'chinese_folklore') {
            encounterPrompt = `
             【特殊判定系统】
             1. **NPC 遭遇判定**（约25%概率触发）：
                请设计符合中式民俗恐怖氛围的NPC：
                - 村中老人（知晓秘密的长者）
                - 神秘戏班成员（诡异的装扮）
                - 失踪者的亲人（悲伤或疯癫）
                - 道士/神婆（懂得驱邪法术）
                
                **每个NPC都要有鲜明的特征和诡异感**。
             
             2. **道具获取判定**（约20%概率触发）：
                如果玩家进行了探索或解谜，请给予符合场景的道具。
             
             ${npcOutputFormat}
             `;
        } else if (currentContext.theme === 'tomb_raiding') {
            encounterPrompt = `
             【特殊判定系统】
             1. **NPC 遭遇判定**（约25%概率触发）：
                请设计符合盗墓探险风格的NPC：
                - 同行的摸金校尉（各有绝活）
                - 考古队成员（学者或冒险家）
                - 神秘的守墓人后裔
                - 被困在墓中的探险者
                
                **每个NPC都要有专业背景和独特技能**。
             
             2. **道具获取判定**（约20%概率触发）：
                如果玩家进行了探索或解谜，请给予符合场景的道具。
             
             ${npcOutputFormat}
             `;
        } else if (currentContext.theme === 'rule_horror') {
            encounterPrompt = `
             【特殊判定系统 - 规则怪谈】
             
             1. **规则违反判定**（核心机制）：
                - 检查玩家的行动是否违反了已知规则
                - 如果违反规则，必须产生严重后果（如：遭遇"它们"、陷入危险、触发死亡结局）
                - 在描述中暗示规则的重要性
             
             2. **诡异NPC遭遇判定**（约30%概率触发）：
                请设计符合规则怪谈氛围的诡异存在：
                - 看似正常但行为诡异的"人"（可能是伪装的怪物）
                - 困在此地的其他受害者（可能已经疯了）
                - 知道部分规则的神秘引路人
                - 违反规则后出现的"它"（恐怖形象）
                
                **NPC要有令人不安的细节描写（如：笑容僵硬、眼睛不会眨、影子方向不对等）**
             
             3. **线索/道具获取判定**（约25%概率触发）：
                - 上一个受害者留下的日记/便条
                - 补充规则的纸条
                - 可能帮助逃脱的钥匙/工具
             
             4. **氛围要求**：
                - 时刻提醒玩家规则的存在
                - 描述中包含细微的诡异细节
                - 营造压抑、不安的心理恐惧
             
             ${npcOutputFormat}

             5. **规则/提示更新**：
                如果玩家发现了新的规则或线索，请在 hints 数组中返回更新后的所有规则（包括旧的和新的）。
                "hints": ["【规则1】...", "【规则2】...", "【新规则】..."]
             `;
        }

        // Format history for the prompt
        let historyContext = "";
        if (currentContext.history && currentContext.history.length > 0) {
            historyContext = "近期发生的事情：\n" + currentContext.history.map(h => {
                if (h.type === 'scenario') return `场景：${h.content.title}`;
                if (h.type === 'action') return `玩家：${h.action}\n结果：${h.result.result_text}`;
                return '';
            }).join('\n') + "\n";
        }

        const prompt = `你是一个文字冒险游戏（AVG）的剧本生成引擎。
    
    【当前游戏状态】
    场景标题：${currentContext.title}
    玩家当前状态：${currentContext.status || '未知'}
    玩家角色：${currentContext.playerRank ? currentContext.playerRank + '级禁闭者' : '普通人'}
    玩家背包：${JSON.stringify(currentContext.inventory || [])}
    
    ${historyContext}
    
    【玩家最新动作】
    ${action}
    
    【任务目标】
    请判定这个动作的结果，并生成下一段剧情。
    
    【写作要求 - 重要】
    1. **简洁精炼**：
       - result_text 控制在 80-150 字以内
       - 使用短句，每句不超过30字
       - 删除冗余描写，保留关键信息
       - 开头直接承接玩家动作的结果
    2. **上下文衔接**：
       - 开头先简要说明玩家动作的直接结果
       - 然后描述场景变化或新发现
    3. **沉浸感**：使用第二人称（"你..."）
    4. **世界观**：严格遵守${currentContext.theme === 'path_to_nowhere' ? '《无期迷途》' : (currentContext.theme === 'chinese_folklore' ? '中式民俗恐怖' : (currentContext.theme === 'tomb_raiding' ? '盗墓探险' : (currentContext.theme === 'rule_horror' ? '规则怪谈（违反规则必死）' : '赛博朋克')))}世界观。
    5. **评分系统**：如果game_over为true，请给出score(0-100), rank(S/A/B/C)和comment(评价)。
    
    ${encounterPrompt}
    
    请以 JSON 格式输出，结构如下：
    {
      "result_text": "简洁的结果描述（80-150字，直接承接玩家动作）",
      "new_options": ["选项1", "选项2", "选项3"],
      "game_over": false,
      "is_win": false,
      "inventory": ["物品1"],
      "hints": ["规则1", "规则2"],
      "status": "玩家状态",
      "npc_encounter": [
        {
          "name": "NPC名字",
          "title": "称号/身份",
          "attitude": "友好/中立/敌对/警惕",
          "description": "外貌特征描述",
          "dialogue": "NPC说的话（可选）"
        }
      ],
      "score": 0,
      "rank": "C",
      "comment": "评价"
    }
    注意：npc_encounter如果没有NPC出场就返回空数组[]。
    不要包含 JSON 以外的任何文本。确保内容是中文的。`;

        const msg = await anthropic.messages.create({
            model: MODEL_NAME,
            max_tokens: 4000, // Increased to prevent truncation
            temperature: 0.8,
            system: "你是一个专业的文字游戏剧本家，擅长创作氛围浓厚、逻辑严密的互动小说。你的文字风格冷峻、细腻，极具代入感。请始终使用中文回复。严禁包含 markdown 格式（如 ```json），仅输出纯 JSON 文本。确保所有字符串中的双引号都已正确转义。",
            messages: [
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "text",
                            "text": prompt
                        }
                    ]
                }
            ]
        });

        const content = msg.content[0].text;
        console.log("Claude response length:", content.length);

        // Robust JSON extraction
        let cleanContent = content.trim();

        // Find the first '{' and the last '}' to extract the JSON object
        const firstOpenBrace = cleanContent.indexOf('{');
        const lastCloseBrace = cleanContent.lastIndexOf('}');

        if (firstOpenBrace !== -1 && lastCloseBrace !== -1) {
            cleanContent = cleanContent.substring(firstOpenBrace, lastCloseBrace + 1);
        } else {
            // Fallback: Remove markdown code blocks if braces search failed (unlikely for valid JSON)
            cleanContent = cleanContent.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
        }

        // Sanitize common issues
        // 1. Remove control characters that JSON.parse dislikes (except newlines/tabs)
        // cleanContent = cleanContent.replace(/[\u0000-\u0019]+/g, ""); 

        try {
            const result = JSON.parse(cleanContent);
            res.json(result);
        } catch (e) {
            console.error("Failed to parse Claude response:", content);
            res.status(500).json({ error: 'Failed to process action', raw: content });
        }

    } catch (error) {
        console.error('Error submitting action:', error);
        res.status(500).json({ error: 'Internal server error', details: error.message });
    }
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});

// Handle React routing, return all requests to React app
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/dist/index.html'));
});
