// app.js
App({
  onLaunch() {
    if (!wx.cloud) {
      console.error('请使用 2.2.3 或以上的基础库以使用云能力');
    } else {
      wx.cloud.init({
        env: 'cloud1-6g67sh8587f55b79', // 替换为你的云环境 ID
        traceUser: true
      });
    }
    // 微信一键登录
    this.login();
  },
  globalData: {
    userInfo: null,
    teamUpPosts: [],
    publicTeamUpPosts: []
  },
  login() {
    wx.login({
      success: res => {
        if (res.code) {
          // 将 code 发送到后台换取 openid（模拟）
          console.log('登录凭证 code:', res.code);

          // 模拟获取 openid（实际开发中应请求后端接口）
          const openid = `openid_${Date.now()}`; // 临时模拟 openid
          console.log('用户 openid:', openid);

          // 保存 openid 到全局变量
          this.globalData.userInfo = {
            id: openid,
            name: '', // 后续可通过 wx.getUserProfile 获取
            avatar: ''
          };
        } else {
          console.error('登录失败！' + res.errMsg);
        }
      }
    });
  }
});