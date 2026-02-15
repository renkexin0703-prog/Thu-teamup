// cloudfunctions/askAI/index.js
const cloud = require('wx-server-sdk');
const rp = require('request-promise');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

exports.main = async (event, context) => {
  console.log('=== 开始执行 askAI 函数 ===');
  console.log('入参:', event);

  const { prompt } = event;
  if (!prompt) {
    return { success: false, message: '请输入提问内容' };
  }

  try {
    console.log('开始调用 DeepSeek API');
    const options = {
      method: 'POST',
      url: 'https://api.deepseek.com/v1/chat/completions',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY}`
      },
      body: {
        model: 'deepseek-chat',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
        max_tokens: 800
      },
      json: true
    };

    const res = await rp(options);
    console.log('DeepSeek 返回:', res);
    const aiReply = res.choices[0].message.content;
    return { success: true, response: aiReply };

  } catch (err) {
    console.error('调用失败:', err);
    return { success: false, message: err.message };
  }
};