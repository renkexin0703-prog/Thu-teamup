// pages/my-activities/my-activities.js
Page({

  /**
   * 页面的初始数据
   */
  data: {
    myActivities: [],
    loading: true
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    // 获取用户的活动投稿数据
    this.getMyActivities();
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow() {
    // 每次进入页面都重新获取最新数据
    this.getMyActivities();
  },

  /**
   * 获取用户的活动投稿数据
   */
  getMyActivities() {
    this.setData({ loading: true });
    
    // 调用云函数获取用户的活动投稿
    wx.cloud.callFunction({
      name: 'getMyActivities',
      success: (res) => {
        console.log('获取活动投稿成功:', res);
        if (res.result.success) {
          // 转换数据格式，确保与前端模板匹配
          const activities = res.result.activities.map(activity => ({
            id: activity._id,
            title: activity.title,
            organizer: activity.organizer,
            department: activity.department,
            grade: activity.targetGrades.join('、'),
            deadline: activity.deadline ? new Date(activity.deadline).toLocaleDateString() : '',
            skills: activity.requiredSkills || [],
            status: activity.status,
            rejectReason: activity.rejectReason || ''
          }));
          
          this.setData({
            myActivities: activities,
            loading: false
          });
        } else {
          console.error('获取活动投稿失败:', res.result.message);
          this.setData({
            myActivities: [],
            loading: false
          });
          wx.showToast({
            title: '获取活动投稿失败',
            icon: 'none'
          });
        }
      },
      fail: (err) => {
        console.error('调用云函数失败:', err);
        this.setData({ loading: false });
        wx.showToast({
          title: '获取活动投稿失败，请重试',
          icon: 'none'
        });
      }
    });
  },

  /**
   * 返回上一页
   */
  goBack() {
    wx.navigateBack();
  }
})