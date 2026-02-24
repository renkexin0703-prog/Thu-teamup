// pages/activity-detail/activity-detail.js
Page({

  /**
   * 页面的初始数据
   */
  data: {

  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {

  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady() {

  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow() {

  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide() {

  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload() {

  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh() {

  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom() {

  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage() {

  }
})
const fakeData = require("../../utils/fake-data.js"); // 引入假数据

Page({
  data: {
    activityDetail: {} // 存储活动详情数据
  },

  // 页面加载时获取活动ID并加载数据
  onLoad(options) {
    // 获取从activity页传递的活动ID
    const actId = options.id;
    console.log("详情页-活动ID：", actId);

    // 1. 先从fake-data的approvedActivities里找
    let activity = fakeData.approvedActivities.find(item => item.id === actId);
    
    // 2. 如果没找到，再从activity.js的mockActivities里找
    if (!activity) {
      const mockActivities = [
        {
          id: 1,
          title: '计算机学院编程大赛',
          organizer: '计算机学院学生会',
          dept: '计算机学院',
          category: '工科',
          deadline: '2024-06-30',
          difficulty: '中等',
          teamJoined: 12,
          teamTotal: 20,
          intro: '计算机学院编程大赛面向全院学生，涵盖算法、Python等方向'
        },
        {
          id: 2,
          title: '文学院征文比赛',
          organizer: '文学院团委',
          dept: '文学院',
          category: '文科',
          deadline: '2024-07-15',
          difficulty: '简单',
          teamJoined: 8,
          teamTotal: 15,
          intro: '文学院征文比赛以“青春”为主题，鼓励原创文学作品'
        },
        {
          id: 3,
          title: '理学院数学建模竞赛',
          organizer: '理学院教务处',
          dept: '理学院',
          category: '理科',
          deadline: '2024-06-25',
          difficulty: '困难',
          teamJoined: 15,
          teamTotal: 30,
          intro: '数学建模竞赛要求3人组队，解决实际数学问题'
        },
        {
          id: 4,
          title: '美术学院海报设计大赛',
          organizer: '美术学院学生会',
          dept: '美术学院',
          category: '美术',
          deadline: '2024-07-10',
          difficulty: '中等',
          teamJoined: 9,
          teamTotal: 25,
          intro: '海报设计大赛围绕校园文化展开，要求原创设计'
        }
      ];
      activity = mockActivities.find(item => item.id == actId);
    }

    // 把找到的活动数据赋值到页面
    this.setData({ activityDetail: activity || {} });
  },

  // 打开外部详情链接（可选）
  openDetailUrl() {
    wx.navigateToMiniProgram({
      // 这里可以替换成实际的小程序链接，或用wx.openUrl打开H5链接
      appId: '', 
      path: this.data.activityDetail.detailUrl
    });
    // 如果是H5链接，用下面的代码：
    // wx.openURL({ url: this.data.activityDetail.detailUrl });
  }
});