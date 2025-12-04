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
const MODEL_NAME = process.env.CLAUDE_MODEL || "claude-3-5-sonnet";
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
        背景：狄斯城（DisCity），一座建立在黑环边缘的末日都市。
        主要区域：
        - MBCC（米诺斯危机管理局）：关押禁闭者的高科技监狱。
        - 辛迪加（Syndicate）：混乱无法地带，黑帮横行，暴力与罪恶的温床。
        - 新城（New City）：繁华的上层社会，秩序井然但暗流涌动。
        - 费沙（Facia）：沙漠与荒野交界的边缘地带。
        - 流民寨（The Rust）：被遗弃的废墟，生存条件极度恶劣。
        核心元素：狂厄（Mania）、禁闭者（Sinners）、黑环、死役、异能。
        玩家角色：你是一名刚刚觉醒的【${playerRank}级禁闭者】。注意：玩家不是局长！
        你的处境：你正处于上述任一区域的危机之中（可能是帮派火拼、狂厄爆发、被通缉追捕等）。
        特殊设定：
        1. 你拥有异能（根据你的等级${playerRank}，能力强度不同），但使用过度会加深狂厄侵蚀。
        2. 你的目标是生存和逃离。
        3. **道具系统**：场景中可能隐藏着关键道具（如：狂厄抑制剂、门禁卡、简易武器、情报记录等）。请在描述中提示玩家注意周围环境，并允许玩家收集和使用这些道具。
        4. 这是一个文字冒险游戏，请注重逻辑性和沉浸感，文本风格要贴近原生游戏。
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
        背景：深埋地下的古代陵墓（如“精绝古城”、“秦岭神树”）。
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
      "initial_options": ["选项1", "选项2", "选项3"]${theme === 'path_to_nowhere' ? ',' + additionalJsonFields : ''}
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
        if (currentContext.theme === 'path_to_nowhere') {
            encounterPrompt = `
             【特殊判定系统】
             1. **NPC 遭遇判定**（约15%概率触发）：
                请根据当前场景，随机安排NPC登场。
                - **米诺斯局长/局长（女）**：**非必定出现**。**仅当玩家陷入危急时刻（如重伤、狂厄即将失控、被FAC重重包围等绝境）时，才有概率作为“救兵”随机出现**。
                  设定：温柔坚毅、有责任感。她拥有“枷锁”能力，可以安抚狂厄，对禁闭者有天然的亲和力与压制力。
                - **其他NPC**：请完全基于《无期迷途》的世界观原创设计符合场景的NPC（如FAC士兵、辛迪加帮派成员、流民、其他原创禁闭者等），**不要使用游戏中已有的知名角色（如卓娅、海拉等），以免人设崩坏**。
             
             2. **道具获取判定**（约20%概率触发）：
                如果玩家进行了探索、搜索或战胜了敌人，请给予玩家符合场景的道具（如：异方晶碎块、狂厄抑制剂、军团弩箭、地下水道地图等），并自动更新到【玩家背包】中。
             `;
        } else if (currentContext.theme === 'cyberpunk_novel') {
            encounterPrompt = `
             【特殊判定系统】
             1. **NPC 遭遇判定**（约15%概率触发）：
                请根据当前场景，随机安排NPC登场（如：公司特工、地下黑客、义体医生、赏金猎人等）。
             
             2. **道具获取判定**（约20%概率触发）：
                如果玩家进行了探索、入侵（Hacking）或战斗，请给予玩家符合场景的道具（如：加密数据盘、军用义体插件、能量电池、急救凝胶、智能手枪等），并自动更新到【玩家背包】中。
             `;
        } else if (currentContext.theme === 'chinese_folklore' || currentContext.theme === 'tomb_raiding') {
             encounterPrompt = `
             【特殊判定系统】
             **道具获取判定**（约20%概率触发）：
             如果玩家进行了探索或解谜，请给予玩家符合场景的道具（如：香灰、古铜币、玉佩、盗墓工具等），并自动更新到【玩家背包】中。
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
    场景描述：${currentContext.description}
    上一轮结果：${currentContext.last_result}
    玩家当前状态：${currentContext.status || '未知'}
    玩家角色：${currentContext.playerRank ? currentContext.playerRank + '级禁闭者' : '普通人'}
    玩家背包：${JSON.stringify(currentContext.inventory || [])}
    
    ${historyContext}
    
    【玩家最新动作】
    ${action}
    
    【任务目标】
    请判定这个动作的结果，并生成下一段剧情。
    
    【写作要求】
    1. **沉浸感**：使用第二人称（“你...”），仿佛玩家身临其境。文风要贴近原生文字游戏，简洁有力，不要过于啰嗦。
    2. **逻辑性**：
       - 严格判定动作的可行性。如果玩家试图做不可能的事（如徒手打破钢门），必须失败。
       - 物品逻辑：如果动作涉及使用物品，必须检查【玩家背包】。如果没有该物品，动作失败。
       - 如果动作是“寻找”、“搜索”等，且场景中有可能存在物品，可以给予物品（更新 inventory）。
    3. **世界观**：严格遵守${currentContext.theme === 'path_to_nowhere' ? '《无期迷途》' : (currentContext.theme === 'chinese_folklore' ? '中式民俗恐怖' : (currentContext.theme === 'tomb_raiding' ? '盗墓探险' : '赛博朋克'))}世界观。
       - 如果是无期迷途，玩家是禁闭者，不是局长。
       - 如果是中式民俗，强调阴森氛围和民俗禁忌。
       - 如果是盗墓，强调风水机关和专业术语（如“人点烛，鬼吹灯”）。
       - 遇到危险时，根据当前世界观的逻辑应对。
    
    ${encounterPrompt}
    
    请以 JSON 格式输出，结构如下：
    {
      "result_text": "结果描述（请使用生动的中文描述，极具沉浸感，符合当前世界观。如果获得了物品，请在描述中提及。）",
      "new_options": ["选项1", "选项2", "选项3"],
      "game_over": boolean,
      "is_win": boolean,
      "inventory": ["物品1", "物品2"],
      "status": "玩家状态（如：正常、轻度侵蚀、重伤等）"
    }
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
