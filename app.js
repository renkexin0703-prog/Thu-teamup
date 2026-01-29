App({
  onLaunch() {
    // 全局初始化
    wx.setStorageSync('fakeDataInit', true);
  },
  globalData: {
    userInfo: null
  }
});