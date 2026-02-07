// pages/my-activities/my-activities.js
const fakeData = require("../../utils/fake-data.js");

Page({

  /**
   * 页面的初始数据
   */
  data: {
    myActivities: []
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    // 获取用户的活动投稿数据
    this.setData({
      myActivities: fakeData.myActivities
    });
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow() {
    // 每次进入页面都重新获取最新数据
    this.setData({
      myActivities: fakeData.myActivities
    });
  },

  /**
   * 返回上一页
   */
  goBack() {
    wx.navigateBack();
  }
})