// 测试不同的模型名称
const models = [
    "claude-3-5-sonnet-20240620",
    "claude-3-sonnet-20240229",
    "claude-3-opus-20240229",
    "claude-3-5-sonnet",
    "claude-3-sonnet",
    "claude-sonnet-3.5"
];

async function testModel(modelName) {
    try {
        console.log(`\n测试模型: ${modelName}`);
        const response = await fetch('http://localhost:3001/api/generate-scenario', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                theme: 'cyberpunk_novel',
                difficulty: 'Normal'
            })
        });

        const data = await response.json();
        if (response.ok) {
            console.log(`✅ ${modelName} - 成功!`);
            return true;
        } else {
            console.log(`❌ ${modelName} - 失败: ${data.error}`);
            return false;
        }
    } catch (error) {
        console.log(`❌ ${modelName} - 错误: ${error.message}`);
        return false;
    }
}

console.log('开始测试米醋支持的模型...\n');
console.log('请在 .env 中逐个尝试以下模型名称：');
models.forEach(m => console.log(`  - ${m}`));
