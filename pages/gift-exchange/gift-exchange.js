const fakeData = require("../../utils/fake-data.js");

Page({
  data: {
    userInfo: fakeData.userInfo
  },

  // 兑换礼品
  exchangeGift(e) {
    const { giftId, needPoints } = e.currentTarget.dataset;
    const userInfo = { ...this.data.userInfo };
    
    // 扣减积分
    userInfo.points -= needPoints;
    // 添加积分记录
    const gift = userInfo.gifts.find(g => g.id === giftId);
    userInfo.pointsRecord.unshift({
      type: "兑换礼品",
      desc: gift.name,
      points: -needPoints,
      time: new Date().toLocaleDateString()
    });
    // 减少库存
    userInfo.gifts = userInfo.gifts.map(g => {
      if (g.id === giftId) {
        return { ...g, stock: g.stock - 1 };
      }
      return g;
    });

    this.setData({ userInfo });
    wx.showToast({
      title: "兑换成功！",
      icon: "success"
    });
  }
});