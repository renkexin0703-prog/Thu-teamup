// cloudfunctions/askAI/index.js
const cloud = require('wx-server-sdk');
const rp = require('request-promise');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

exports.main = async (event, context) => {
  console.log('=== 开始执行 askAI 函数 ===');
  console.log('入参:', event);

  const { prompt, messages, userContext } = event;
  if (!prompt) {
    return { success: false, message: '请输入提问内容' };
  }

  try {
    console.log('开始调用 DeepSeek API');

    // 🔥 核心：区分欢迎语和正常提问，定制不同Prompt
    let systemContent = '';
    let userPrompt = prompt;

    // 首次欢迎语Prompt（基于上下文个性化）
    if (prompt === '发送个性化欢迎语') {
      systemContent = `
你是Deepseek-Teamup智能体，负责清华校园活动与组队咨询，需遵守：
1. 欢迎语要结合【用户上下文】中的信息（院系、年级、技能）做个性化问候；
2. 引导语要举例具体的提问方向（如活动推荐、组队帖查找）；
3. 语气亲切自然，符合校园场景，避免机械；
4. 若上下文无用户信息，使用通用欢迎语。

【用户上下文】
${userContext || '暂无用户上下文'}

欢迎语要求：
- 开头：你好，我是Deepseek-Teamup智能体，很高兴见到你！
- 中间：结合用户信息做个性化问候（如“作为计算机系大三的同学”）；
- 结尾：引导用户提问，举例2-3个具体问题（如“最近有什么适合计算机系的活动？”“帮我找软件设计大赛的组队帖”）。
      `;
      userPrompt = '请生成符合要求的个性化欢迎语';
    } 
    // 正常对话Prompt（保留之前的推理逻辑）
    else {
      systemContent = `
你是一个专业的清华校园组队/活动推荐智能助手，需遵守以下规则：
1. 基础信息优先：必须以【用户上下文】中的信息为核心（用户信息、组队帖、院系介绍、小程序规则）；
2. 智能推理要求：
   - 可基于用户的院系、技能、已发布的组队帖，推导适合的活动/组队方向；
   - 可结合院系特点（如计算机系擅长编程），给用户个性化建议；
   - 可解释推荐理由（比如“你是计算机系大三学生，擅长Python，适合参加软件设计大赛”）；
3. 信息边界：如果上下文没有相关基础信息（如未提及某活动），不要编造，但可基于通用校园常识补充合理建议；
4. 回答风格：自然流畅，像真人沟通，分点清晰（必要时），避免机械生硬。

【用户上下文】
${userContext || '暂无用户上下文'}
      `;
    }

    // 构建对话历史
    const chatHistory = [];
    if (messages && messages.length > 0) {
      messages.forEach(msg => {
        chatHistory.push({
          role: msg.role,
          content: msg.content
        });
      });
    }

    // 调用参数（保留0.7温度，兼顾推理和自然度）
    const options = {
      method: 'POST',
      url: 'https://api.deepseek.com/v1/chat/completions',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY}`
      },
      body: {
        model: 'deepseek-chat',
        messages: [
          { role: 'system', content: systemContent.trim() },
          ...chatHistory,
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.7,
        max_tokens: 1200,
        top_p: 0.9,
        presence_penalty: 0.1,
        frequency_penalty: 0.1
      },
      json: true
    };

    console.log('DeepSeek 调用参数:', JSON.stringify(options.body, null, 2));
    const res = await rp(options);
    console.log('DeepSeek 返回:', res);
    
    const aiReply = res.choices[0].message.content;
    return { success: true, response: aiReply };

  } catch (err) {
    console.error('DeepSeek 调用失败:', err);
    return { 
      success: false, 
      message: err.message || '调用AI失败，请稍后重试',
      detail: err.response ? err.response.body : ''
    };
  }
};