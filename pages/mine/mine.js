Page({
  data: {
    userInfo: wx.getStorageSync('userInfo') || {},
    userScore: wx.getStorageSync('userScore') || 0,
    editUserInfoShow: false,
    editForm: {
      name: '',
      gender: '',
      grade: '',
      dept: '',
      skill: '',
      contact: {
        phone: '',
        wechat: ''
      }
    },
    submitActivityShow: false,
    activityForm: {
      title: '',
      organizer: '',
      dept: '',
      category: '',
      deadline: '',
      difficulty: ''
    },
    teammatesShow: false,
    teammatesList: wx.getStorageSync('teammates') || [],
    evaluateShow: false,
    currentTeammate: {},
    evaluateTag: '',
    evaluateScore: 5
  },

  onShow() {
    // 刷新数据
    this.setData({
      userInfo: wx.getStorageSync('userInfo') || {},
      userScore: wx.getStorageSync('userScore') || 0,
      teammatesList: wx.getStorageSync('teammates') || []
    });
  },

  // 打开编辑个人信息
  openEditUserInfo() {
    const { userInfo } = this.data;
    this.setData({
      editForm: {
        name: userInfo.name || '',
        gender: userInfo.gender || '',
        grade: userInfo.grade || '',
        dept: userInfo.dept || '',
        skill: userInfo.skill || '',
        contact: {
          phone: userInfo.contact?.phone || '',
          wechat: userInfo.contact?.wechat || ''
        }
      },
      editUserInfoShow: true
    });
  },

  // 关闭编辑个人信息
  closeEditUserInfo() {
    this.setData({ editUserInfoShow: false });
  },

  // 编辑表单变化
  onEditFormChange(e) {
    const { key } = e.currentTarget.dataset;
    const { editForm } = this.data;
    if (key === 'phone' || key === 'wechat') {
      editForm.contact[key] = e.detail;
    } else {
      editForm[key] = e.detail;
    }
    this.setData({ editForm });
  },

  // 保存个人信息
  saveUserInfo() {
    wx.setStorageSync('userInfo', this.data.editForm);
    this.setData({
      userInfo: this.data.editForm,
      editUserInfoShow: false
    });
    wx.showToast({ title: '信息保存成功', icon: 'success' });
  },

  // 打开提交活动
  openSubmitActivity() {
    this.setData({ submitActivityShow: true });
  },

  // 关闭提交活动
  closeSubmitActivity() {
    this.setData({ submitActivityShow: false });
  },

  // 活动表单变化
  onActivityFormChange(e) {
    const { key } = e.currentTarget.dataset;
    const { activityForm } = this.data;
    activityForm[key] = e.detail;
    this.setData({ activityForm });
  },

  // 提交活动信息
  submitActivityInfo() {
    const { activityForm } = this.data;
    // 简单校验
    const required = ['title', 'organizer', 'dept', 'category', 'deadline', 'difficulty'];
    const isComplete = required.every(key => activityForm[key]);
    if (!isComplete) {
      wx.showToast({ title: '请填写完整信息', icon: 'none' });
      return;
    }
    // 模拟提交审核
    wx.showToast({ title: '提交成功，等待审核', icon: 'success' });
    this.setData({
      submitActivityShow: false,
      activityForm: {
        title: '',
        organizer: '',
        dept: '',
        category: '',
        deadline: '',
        difficulty: ''
      }
    });
    // 模拟增加积分（审核通过后）
    setTimeout(() => {
      let currentScore = this.data.userScore;
      currentScore += 50;
      wx.setStorageSync('userScore', currentScore);
      this.setData({ userScore: currentScore });
      wx.showToast({ title: '活动审核通过，+50积分', icon: 'success' });
    }, 1000);
  },

  // 打开我的合作者
  openTeammates() {
    this.setData({ teammatesShow: true });
  },

  // 关闭我的合作者
  closeTeammates() {
    this.setData({ teammatesShow: false });
  },

  // 评价队友
  evaluateTeammate(e) {
    this.setData({
      currentTeammate: e.currentTarget.dataset.teammate,
      evaluateShow: true,
      evaluateTag: '',
      evaluateScore: 5
    });
  },

  // 关闭评价弹窗
  closeEvaluate() {
    this.setData({ evaluateShow: false });
  },

  // 评价标签变化
  onEvaluateTagChange(e) {
    this.setData({ evaluateTag: e.detail });
  },

  // 评价分数变化
  onEvaluateScoreChange(e) {
    this.setData({ evaluateScore: e.detail });
  },

  // 提交评价
  submitEvaluate() {
    if (!this.data.evaluateTag) {
      wx.showToast({ title: '请输入评价标签', icon: 'none' });
      return;
    }
    wx.showToast({ title: '评价提交成功', icon: 'success' });
    this.setData({ evaluateShow: false });
    // 模拟更新队友评价（实际需后端支持）
  },

  // 每日登录
  checkIn() {
    const lastCheckIn = wx.getStorageSync('lastCheckIn');
    const today = new Date().toLocaleDateString();
    if (lastCheckIn === today) {
      wx.showToast({ title: '今日已登录', icon: 'none' });
      return;
    }
    let currentScore = this.data.userScore;
    currentScore += 5;
    wx.setStorageSync('userScore', currentScore);
    wx.setStorageSync('lastCheckIn', today);
    this.setData({ userScore: currentScore });
    wx.showToast({ title: '登录成功，+5积分', icon: 'success' });
  },

  // 发圈宣传
  shareToCircle() {
    wx.showShareMenu({
      withShareTicket: true,
      menus: ['shareAppMessage', 'shareTimeline']
    });
    // 模拟分享后增加积分
    setTimeout(() => {
      let currentScore = this.data.userScore;
      currentScore += 50;
      wx.setStorageSync('userScore', currentScore);
      this.setData({ userScore: currentScore });
      wx.showToast({ title: '分享成功，+50积分', icon: 'success' });
    }, 1000);
  },

  // 积分兑换礼品
  exchangeGift() {
    wx.showModal({
      title: '积分兑换',
      content: '1. 文创礼品（50积分）\n2. 面试券（100积分）',
      success: (res) => {
        if (res.confirm) {
          wx.showActionSheet({
            itemList: ['文创礼品', '面试券'],
            success: (res) => {
              let score = 0;
              if (res.tapIndex === 0) score = 50;
              else score = 100;

              if (this.data.userScore < score) {
                wx.showToast({ title: '积分不足', icon: 'none' });
                return;
              }

              let currentScore = this.data.userScore - score;
              wx.setStorageSync('userScore', currentScore);
              this.setData({ userScore: currentScore });
              wx.showToast({ title: '兑换成功', icon: 'success' });
            }
          });
        }
      }
    });
  }
});