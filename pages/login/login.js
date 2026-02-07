// pages/login/login.js
const app = getApp();

Page({
  data: {
    isLoggingIn: false // 是否正在登录
  },

  // 用户点击【微信授权一键登录】按钮
  onLogin() {
    if (this.data.isLoggingIn) return; // 防止重复点击
    this.setData({ isLoggingIn: true });

    // 第一步：直接调用getUserProfile（符合微信点击触发规则）
    wx.getUserProfile({
      desc: '用于完善会员资料', // 声明用途（必填）
      success: (profileRes) => {
        const userInfo = profileRes.userInfo;
        console.log('用户昵称/头像信息:', userInfo);

        // 第二步：调用云函数获取openid
        wx.cloud.callFunction({
          name: 'getOpenid',
          success: (res) => {
            const openid = res.result.openid;
            console.log('用户唯一ID(openid):', openid);

            // 更新全局用户信息
            app.globalData.userInfo = {
              id: openid,
              name: userInfo.nickName,
              avatar: userInfo.avatarUrl
            };
            // 同步到本地缓存
            wx.setStorageSync('userInfo', app.globalData.userInfo);

            // 第三步：数据库操作（先查后写，避免重复）
            const db = wx.cloud.database();
            const usersCollection = db.collection('users');

            // 先查询该用户是否已存在
            usersCollection.doc(openid).get({
              success: () => {
                // 用户已存在 → 更新信息（比如头像/昵称）
                usersCollection.doc(openid).update({
                  data: {
                    name: userInfo.nickName,
                    avatar: userInfo.avatarUrl,
                    updateTime: db.serverDate() // 新增更新时间
                  },
                  success: () => {
                    console.log('用户信息更新成功');
                  },
                  fail: (err) => {
                    console.error('用户信息更新失败:', err);
                  }
                });
              },
              fail: () => {
                // 用户不存在 → 新增数据
                usersCollection.add({
                  data: {
                    _id: openid,
                    name: userInfo.nickName,
                    avatar: userInfo.avatarUrl,
                    createTime: db.serverDate()
                  },
                  success: () => {
                    console.log('用户信息新增成功');
                  },
                  fail: (err) => {
                    console.error('用户信息新增失败:', err);
                  }
                });
              }
            });

            // 跳转到首页
            wx.switchTab({
              url: '/pages/index/index',
              fail: err => {
                console.error('跳转首页失败:', err);
                wx.showToast({ title: '跳转失败，请重试', icon: 'none' });
              },
              complete: () => {
                this.setData({ isLoggingIn: false });
              }
            });
          },
          fail: (err) => {
            console.error('获取用户唯一ID失败:', err);
            wx.showToast({ title: '登录失败，请检查云函数', icon: 'none' });
            this.setData({ isLoggingIn: false });
          }
        });
      },
      fail: (err) => {
        console.error('获取用户信息失败:', err);
        wx.showToast({ title: '授权失败，请重试', icon: 'none' });
        this.setData({ isLoggingIn: false });
      }
    });
  }
});