Page({
  data: {
    userInfo: {
      points: 0,
      pointsRecord: []
    },
    loading: true
  },

  onLoad() {
    this.getPointsRecord();
  },

  onShow() {
    this.getPointsRecord();
  },

  getPointsRecord() {
    this.setData({ loading: true });
    
    // 调用云函数获取积分记录
    wx.cloud.callFunction({
      name: 'getPointsHistory',
      success: (res) => {
        console.log('获取积分记录成功:', res);
        if (res.result.success) {
          // 转换数据格式，确保与前端模板匹配
          const pointsRecord = res.result.data.history.map(item => ({
            type: item.operation_name,
            desc: item.notes,
            time: new Date(item.timestamp).toLocaleString(),
            points: item.points_change
          }));
          
          this.setData({
            userInfo: {
              points: res.result.data.totalPoints,
              pointsRecord: pointsRecord
            },
            loading: false
          });
        } else {
          console.error('获取积分记录失败:', res.result);
          this.setData({
            userInfo: {
              points: 0,
              pointsRecord: []
            },
            loading: false
          });
          wx.showToast({
            title: res.result.message || '获取积分记录失败',
            icon: 'none'
          });
        }
      },
      fail: (err) => {
        console.error('调用云函数失败:', err);
        this.setData({ loading: false });
        wx.showToast({
          title: '获取积分记录失败，请重试',
          icon: 'none'
        });
      }
    });
  }
});