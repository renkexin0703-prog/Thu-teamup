// cloudfunctions/getOpenid/index.js
// 1. 引入微信云开发服务端SDK
const cloud = require('wx-server-sdk');

// 2. 初始化云环境（必须和小程序端的环境ID一致）
cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV // 自动使用当前云环境（推荐），也可以写死你的环境ID：'cloud1-6g67sh8587f55b79'
});

// 3. 云函数主逻辑
exports.main = async (event, context) => {
  // 获取微信上下文（包含openid、appid等）
  const wxContext = cloud.getWXContext();
  
  // 返回用户唯一ID（openid）等信息
  return {
    openid: wxContext.OPENID, // 用户在当前小程序的唯一ID（核心）
    appid: wxContext.APPID,
    unionid: wxContext.UNIONID // 多小程序/公众号关联时用到，没有则返回null
  };
};