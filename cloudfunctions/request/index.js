// cloudfunctions/request/index.js
const cloud = require('wx-server-sdk');
cloud.init();

exports.main = async (event, context) => {
  const { url, method = 'GET', header = {}, data = {} } = event;

  if (!url) {
    return { success: false, message: '请提供请求地址 url' };
  }

  try {
    // 修复：云函数中用 cloud.http.request 而非 wx.request
    const res = await cloud.http.request({
      url: url,
      method: method,
      header: header,
      data: data,
      timeout: 10000 // 10秒超时
    });

    return {
      success: true,
      data: res.data,
      statusCode: res.statusCode,
      headers: res.headers // 修复：云函数返回的是 headers 而非 header
    };
  } catch (err) {
    console.error('HTTP 请求失败:', err);
    return {
      success: false,
      message: '网络请求失败，请检查网络或目标服务是否可用',
      error: err.message
    };
  }
};