// app.js
App({
  onLaunch() {
    if (!wx.cloud) {
      console.error('请使用 2.2.3 或以上的基础库以使用云能力');
    } else {
      wx.cloud.init({
        env: 'cloud1-6g67sh8587f55b79', 
        traceUser: true
      });
    }
    // 新增：初始化时读取本地缓存的【我的】页信息（避免全局变量为空）
    const localUserInfo = wx.getStorageSync('userInfo') || {};
    const loginUserInfo = {
      id: '',
      name: '',
      avatar: ''
    };
    // 合并：本地缓存的信息优先级最高
    this.globalData.userInfo = { ...loginUserInfo, ...localUserInfo };
  },
  globalData: {
    // 核心修改：只保留基础字段，去掉默认空的department/grade/skills（避免覆盖）
    userInfo: {},
    teamUpPosts: [],
    publicTeamUpPosts: []
  },
  login() {}
});