// pages/login/login.js
const app = getApp();

Page({
  data: {
    isLoggingIn: false
  },

  onLogin() {
    if (this.data.isLoggingIn) return;
    this.setData({ isLoggingIn: true });

    wx.getUserProfile({
      desc: '用于完善会员资料',
      success: () => {
        // 触发 app.js 中的 login 方法
        app.login();
      },
      fail: () => {
        console.error('获取用户信息失败');
        wx.showToast({ title: '授权失败，请重试', icon: 'none' });
        this.setData({ isLoggingIn: false });
      }
    });
  }
});