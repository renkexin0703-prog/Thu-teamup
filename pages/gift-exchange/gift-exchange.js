const fakeData = require("../../utils/fake-data.js");

Page({
  data: {
    userInfo: fakeData.userInfo,
    gifts: fakeData.userInfo.gifts
  },

  onLoad() {
    this.loadUserInfo();
  },

  onShow() {
    this.loadUserInfo();
  },

  loadUserInfo() {
    const app = getApp();
    const openid = app.globalData.userInfo?.id;

    if (openid) {
      const db = wx.cloud.database();
      
      db.collection('users').doc(openid).get({
        success: (res) => {
          if (res && res.data) {
            const updatedUserInfo = {
              ...this.data.userInfo,
              ...res.data
            };
            this.setData({ userInfo: updatedUserInfo });
            
            db.collection('user_points').doc(openid).get({
              success: (pointsRes) => {
                if (pointsRes && pointsRes.data) {
                  this.setData({
                    'userInfo.points': pointsRes.data.total_points || 0
                  });
                }
              },
              fail: (err) => {
                console.log("获取用户积分失败");
              }
            });
          }
        },
        fail: (err) => {
          console.log("获取用户信息失败");
        }
      });
    }
  },

  async exchangeGift(e) {
    const { giftId, needPoints, giftName } = e.currentTarget.dataset;
    
    if (this.data.userInfo.points < needPoints) {
      wx.showToast({
        title: "积分不足",
        icon: "none"
      });
      return;
    }

    wx.showLoading({ title: "兑换中..." });

    try {
      const res = await wx.cloud.callFunction({
        name: 'exchangeGift',
        data: {
          giftId: giftId,
          giftName: giftName,
          pointsCost: needPoints
        }
      });

      wx.hideLoading();

      if (res.result.success) {
        this.setData({
          'userInfo.points': res.result.data.totalPoints
        });

        wx.showToast({
          title: "兑换成功！",
          icon: "success"
        });
      } else {
        wx.showToast({
          title: res.result.message || "兑换失败",
          icon: "none"
        });
      }
    } catch (err) {
      wx.hideLoading();
      console.error("兑换失败:", err);
      wx.showToast({
        title: "兑换失败，请重试",
        icon: "none"
      });
    }
  }
});
