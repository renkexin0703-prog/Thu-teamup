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
    this.setData({
      userInfo: wx.getStorageSync('userInfo') || {},
      userScore: wx.getStorageSync('userScore') || 0,
      teammatesList: wx.getStorageSync('teammates') || []
    });
  },

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

  closeEditUserInfo() {
    this.setData({ editUserInfoShow: false });
  },

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

  // 核心修复：强制覆盖云数据库的“微信用户”名称
  saveUserInfo() {
    const { editForm } = this.data;
    const app = getApp();
    const currentUser = app.globalData.userInfo; // 登录后的openid

    // 1. 保存到本地缓存
    wx.setStorageSync('userInfo', editForm);
    // 2. 同步到全局变量
    app.globalData.userInfo = {
      ...app.globalData.userInfo,
      ...editForm,
      department: editForm.dept,
      skills: editForm.skill ? editForm.skill.split(',') : []
    };
    // 3. 强制覆盖云数据库（替换“微信用户”）
    const db = wx.cloud.database();
    db.collection('users').doc(currentUser.id).set({
      data: {
        _id: currentUser.id,
        name: editForm.name || currentUser.name, // 优先自定义名称
        gender: editForm.gender,
        grade: editForm.grade,
        dept: editForm.dept,
        skill: editForm.skill,
        contact: editForm.contact,
        avatar: currentUser.avatar, // 保留微信头像
        createTime: db.serverDate(),
        updateTime: db.serverDate()
      },
      success: () => {
        console.log('云数据库信息覆盖成功（已替换“微信用户”）');
      },
      fail: (err) => {
        console.error('云数据库同步失败:', err);
      }
    });
    // 4. 更新页面
    this.setData({
      userInfo: editForm,
      editUserInfoShow: false
    });
    wx.showToast({ title: '信息保存成功', icon: 'success' });
  },

  openSubmitActivity() {
    this.setData({ submitActivityShow: true });
  },

  closeSubmitActivity() {
    this.setData({ submitActivityShow: false });
  },

  onActivityFormChange(e) {
    const { key } = e.currentTarget.dataset;
    const { activityForm } = this.data;
    activityForm[key] = e.detail;
    this.setData({ activityForm });
  },

  submitActivityInfo() {
    const { activityForm } = this.data;
    const required = ['title', 'organizer', 'dept', 'category', 'deadline', 'difficulty'];
    const isComplete = required.every(key => activityForm[key]);
    if (!isComplete) {
      wx.showToast({ title: '请填写完整信息', icon: 'none' });
      return;
    }
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
    setTimeout(() => {
      let currentScore = this.data.userScore;
      currentScore += 50;
      wx.setStorageSync('userScore', currentScore);
      this.setData({ userScore: currentScore });
      wx.showToast({ title: '活动审核通过，+50积分', icon: 'success' });
    }, 1000);
  },

  openTeammates() {
    this.setData({ teammatesShow: true });
  },

  closeTeammates() {
    this.setData({ teammatesShow: false });
  },

  evaluateTeammate(e) {
    this.setData({
      currentTeammate: e.currentTarget.dataset.teammate,
      evaluateShow: true,
      evaluateTag: '',
      evaluateScore: 5
    });
  },

  closeEvaluate() {
    this.setData({ evaluateShow: false });
  },

  onEvaluateTagChange(e) {
    this.setData({ evaluateTag: e.detail });
  },

  onEvaluateScoreChange(e) {
    this.setData({ evaluateScore: e.detail });
  },

  submitEvaluate() {
    if (!this.data.evaluateTag) {
      wx.showToast({ title: '请输入评价标签', icon: 'none' });
      return;
    }
    wx.showToast({ title: '评价提交成功', icon: 'success' });
    this.setData({ evaluateShow: false });
  },

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

  shareToCircle() {
    wx.showShareMenu({
      withShareTicket: true,
      menus: ['shareAppMessage', 'shareTimeline']
    });
    setTimeout(() => {
      let currentScore = this.data.userScore;
      currentScore += 50;
      wx.setStorageSync('userScore', currentScore);
      this.setData({ userScore: currentScore });
      wx.showToast({ title: '分享成功，+50积分', icon: 'success' });
    }, 1000);
  },

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