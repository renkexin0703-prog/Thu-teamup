// pages/contact-requests/contact-requests.js
Page({

  /**
   * 页面的初始数据
   */
  data: {
    contactRequests: [],
    loading: false
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {

  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow() {
    this.loadContactRequests();
  },

  /**
   * 加载联系我的人列表
   */
  loadContactRequests() {
    const app = getApp();
    const currentUser = app.globalData.userInfo;
    
    if (!currentUser || !currentUser.id) {
      wx.showToast({ title: '请先登录', icon: 'none' });
      return;
    }

    this.setData({ loading: true });
    
    const db = wx.cloud.database();
    // 假设有一个contacts集合，记录谁联系了当前用户
    // 这里查询contacts集合中receiverId等于当前用户id的记录
    db.collection('contacts')
      .where({
        receiverId: currentUser.id
      })
      .get()
      .then(res => {
        if (res.data && res.data.length > 0) {
          const requestIds = res.data.map(item => item.senderId);
          // 根据senderId查询用户信息
          return db.collection('users')
            .where({
              _id: db.command.in(requestIds)
            })
            .get();
        } else {
          return { data: [] };
        }
      })
      .then(userRes => {
        const contactRequests = userRes.data.map(user => {
          let avatarUrl = '/images/default-avatar.png';
          if (user.avatar && user.avatar.startsWith('cloud://')) {
            // 头像URL处理会在页面渲染时进行
            avatarUrl = user.avatar;
          }
          return {
            ...user,
            avatar: avatarUrl
          };
        });
        this.setData({ contactRequests });
      })
      .catch(err => {
        console.error('获取联系请求失败:', err);
        wx.showToast({ title: '获取数据失败', icon: 'none' });
      })
      .finally(() => {
        this.setData({ loading: false });
      });
  },

  /**
   * 查看用户详情
   */
  viewUserProfile(e) {
    const userId = e.currentTarget.dataset.userid;
    wx.navigateTo({
      url: `/pages/user-profile/user-profile?userId=${userId}`
    });
  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh() {
    this.loadContactRequests();
    wx.stopPullDownRefresh();
  }
});