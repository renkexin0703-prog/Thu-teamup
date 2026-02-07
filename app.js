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
  },
  globalData: {
    userInfo: null,
    teamUpPosts: [],
    publicTeamUpPosts: []
  }
});