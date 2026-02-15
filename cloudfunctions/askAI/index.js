// cloudfunctions/askAI/index.js
const cloud = require('wx-server-sdk');
cloud.init();

exports.main = async (event, context) => {
  const { prompt } = event;

  if (!prompt) {
    return { success: false, message: '请输入提问内容' };
  }

  // 获取当前用户 openid
  const openId = cloud.getWXContext().OPENID;

  try {
    // 1. 调用大模型 API
    const res = await cloud.callFunction({
      name: 'request',
      data: {
        url: 'https://llmapi.paratera.com/v1',
        method: 'POST',
        header: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.API_KEY}`
        },
        data: {
          model: process.env.MODEL_NAME,
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.1,
          max_tokens: 800
        }
      }
    });

    const apiRes = res.result.data;

    if (apiRes && apiRes.choices && apiRes.choices.length > 0) {
      const aiResponse = apiRes.choices[0].message.content;

      // 2. 将对话记录保存到云数据库
      const db = cloud.database();
      await db.collection('chatHistory').add({
        data: {
          userId: openId,
          userPrompt: prompt,
          aiResponse: aiResponse,
          createTime: db.serverDate()
        }
      });

      return {
        success: true,
        response: aiResponse
      };
    } else {
      return {
        success: false,
        message: 'API 返回异常，请检查参数或联系管理员'
      };
    }
  } catch (err) {
    console.error('调用大模型失败:', err);
    return {
      success: false,
      message: '服务暂时不可用，请稍后再试'
    };
  }
};