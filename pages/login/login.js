// pages/login/login.js
const app = getApp();

Page({
  data: {
    isLoggingIn: false // 是否正在登录
  },

  // 用户点击【微信授权一键登录】按钮
  onLogin() {
    this.setData({ isLoggingIn: true });

    wx.getUserProfile({
      desc: '用于完善会员资料', // 声明获取用户个人信息后的用途
      success: res => {
        const userInfo = res.userInfo;
        console.log('用户信息:', userInfo);

        // 更新全局用户信息
        app.globalData.userInfo.name = userInfo.nickName;
        app.globalData.userInfo.avatar = userInfo.avatarUrl;

        // 可选：将用户信息上传到云数据库
        wx.cloud.database().collection('users').add({
          data: {
            _id: app.globalData.userInfo.id,
            name: userInfo.nickName,
            avatar: userInfo.avatarUrl,
            createTime: new Date().toISOString()
          }
        }).then(() => {
          console.log('用户信息上传成功');
        }).catch(err => {
          console.error('用户信息上传失败:', err);
        });

        // 跳转到首页
        wx.switchTab({
          url: '/pages/index/index',
          success: () => {
            console.log('跳转到首页成功');
          },
          fail: err => {
            console.error('跳转失败:', err);
          }
        });
      },
      fail: err => {
        console.error('获取用户信息失败:', err);
        wx.showToast({ title: '授权失败，请重试', icon: 'none' });
        this.setData({ isLoggingIn: false });
      }
    });
  }
});