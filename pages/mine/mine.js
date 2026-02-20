// pages/mine/mine.js
Page({
  data: {
    userInfo: {},
    userScore: 0,
    editUserInfoShow: false,
    editForm: {
      name: '',
      gender: '',
      grade: '',
      dept: '',
      skill: '',
      avatar: '',
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

  onLoad() {
    console.log('监听页面加载');
    this.loadCurrentUserInfo();
  },
  
  onShow() {
    console.log('监听页面显示');
    this.loadCurrentUserInfo();
  },

  // 加载用户信息：云数据库优先，本地缓存兜底
  loadCurrentUserInfo() {
    try {
      const localUserInfo = wx.getStorageSync('userInfo') || {};
      console.log('🔄 开始加载用户信息:', localUserInfo);

      if (localUserInfo.id) {
        console.log('☁️ 从云数据库加载用户信息...');
        this.loadFromCloud(localUserInfo.id);
      } else {
        console.log('💾 使用本地缓存信息...');
        this.processUserInfo(localUserInfo);
      }
    } catch (error) {
      console.error('❌ 加载用户信息失败:', error);
      this.useDefaultUserInfo();
    }
  },
    
  // 从云数据库加载用户信息
  loadFromCloud(userId) {
    const db = wx.cloud.database();
    db.collection('users').doc(userId).get().then(res => {
      if (res.data) {
        this.processUserInfo(res.data);
      } else {
        this.useDefaultUserInfo();
      }
    }).catch(err => {
      console.error('云数据库查询失败:', err);
      // 降级到本地缓存
      const localUser = wx.getStorageSync('userInfo') || {};
      this.processUserInfo(localUser);
    });
  },

  // 处理用户信息，统一头像逻辑
  processUserInfo(userInfo) {
    // 1. 统一处理头像URL
    let avatarUrl = this.handleAvatarUrl(userInfo.avatar);
    // 2. 先从缓存获取临时URL（避免重复请求）
    const tempAvatarCache = wx.getStorageSync('tempAvatarUrl_' + userInfo.id);
    
    // 3. 基础信息设置
    const userScore = wx.getStorageSync('userScore') || 0;
    this.setData({
      userInfo: {
        ...userInfo,
        avatar: tempAvatarCache || avatarUrl
      },
      userScore
    });

    // 4. 仅当没有缓存且是云存储URL时，获取临时URL
    if (avatarUrl.startsWith('cloud://') && !tempAvatarCache) {
      console.log('☁️ 检测到云存储头像，获取临时URL...');
      wx.cloud.getTempFileURL({
        fileList: [avatarUrl],
        success: (res) => {
          if (res.fileList[0]?.tempFileURL) {
            const tempUrl = res.fileList[0].tempFileURL;
            // 更新页面和缓存（缓存1天）
            this.setData({ 'userInfo.avatar': tempUrl });
            wx.setStorageSync('tempAvatarUrl_' + userInfo.id, tempUrl);
            // 更新本地用户信息的头像
            const updatedUser = { ...userInfo, avatar: tempUrl };
            wx.setStorageSync('userInfo', updatedUser);
          }
        },
        fail: (err) => {
          console.error('获取临时URL失败:', err);
          this.setData({ 'userInfo.avatar': '/images/default-avatar.png' });
        }
      });
    }
  },

  // 使用默认用户信息
  useDefaultUserInfo() {
    this.setData({
      userInfo: {
        name: '未登录用户',
        avatar: '/images/default-avatar.png',
        credit: 80
      },
      userScore: 0
    });
  },

  // 统一处理头像URL（修复：现在会被调用）
  handleAvatarUrl(avatarUrl) {
    if (!avatarUrl) {
      return '/images/default-avatar.png';
    }
    
    console.log('原始头像URL:', avatarUrl);
    
    // 处理云存储URL格式问题（清理重复环境ID）
    if (avatarUrl.startsWith('cloud://')) {
      const cleanUrl = avatarUrl.replace(/cloud:\/\/[^.]+\./, 'cloud://');
      console.log('清理后云存储URL:', cleanUrl);
      return cleanUrl;
    }
    
    // 处理相对路径/网络URL
    if (avatarUrl.startsWith('/') || avatarUrl.startsWith('http')) {
      return avatarUrl;
    }
    
    // 其他情况返回默认头像
    return '/images/default-avatar.png';
  },

  openEditUserInfo() {
    const { userInfo } = this.data;
    console.log('打开编辑界面，当前用户信息:', userInfo);
    
    this.setData({
      editForm: {
        name: userInfo.name || '',
        gender: userInfo.gender || '',
        grade: userInfo.grade || '',
        dept: userInfo.dept || '',
        skill: userInfo.skill || '',
        avatar: this.handleAvatarUrl(userInfo.avatar), // 统一处理头像
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

  // 选择头像
  chooseAvatar() {
    wx.chooseImage({
      count: 1,
      sizeType: ['original', 'compressed'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        const tempFilePath = res.tempFilePaths[0];
        this.uploadAvatar(tempFilePath);
      },
      fail: (err) => {
        console.error('选择图片失败:', err);
        wx.showToast({ title: '选择图片失败', icon: 'none' });
      }
    });
  },

  // 上传头像到云存储（优化登录态判断）
  uploadAvatar(filePath) {
    const app = getApp();
    const userInfo = app.globalData.userInfo;
    
    // 严谨的登录态校验
    if (!userInfo || !userInfo.id) {
      wx.showToast({ title: '请先完成登录', icon: 'none' });
      wx.navigateTo({ url: '/pages/login/login' }); // 跳转到登录页
      return;
    }

    wx.showLoading({ title: '上传中...' });
    
    // 上传到云存储
    wx.cloud.uploadFile({
      cloudPath: `avatars/${userInfo.id}_${Date.now()}.png`,
      filePath: filePath,
      success: (res) => {
        // 更新表单中的头像（云存储fileID）
        this.setData({ 'editForm.avatar': res.fileID });
        // 清除旧的临时URL缓存
        wx.removeStorageSync('tempAvatarUrl_' + userInfo.id);
        wx.hideLoading();
        wx.showToast({ title: '头像选择成功', icon: 'success' });
      },
      fail: (err) => {
        wx.hideLoading();
        console.error('上传头像失败:', err);
        wx.showToast({ title: '上传失败，请重试', icon: 'none' });
      }
    });
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

  // 保存用户信息（优化：只更新核心字段）
  saveUserInfo() {
    const { editForm } = this.data;
    const app = getApp();
    const currentUser = app.globalData.userInfo;
  
    if (!currentUser || !currentUser.id) {
      wx.showToast({ title: '登录状态失效，请重新登录', icon: 'none' });
      return;
    }

    // 1. 整理要更新的字段（避免冗余）
    const updateData = {
      name: editForm.name || currentUser.name,
      gender: editForm.gender,
      grade: editForm.grade,
      dept: editForm.dept,
      skill: editForm.skill,
      avatar: editForm.avatar,
      contact: editForm.contact,
      updateTime: wx.cloud.database().serverDate()
    };
  
    // 2. 保存到本地缓存
    const newUserInfo = { ...currentUser, ...updateData };
    wx.setStorageSync('userInfo', newUserInfo);
  
    // 3. 同步到全局变量
    app.globalData.userInfo = newUserInfo;
  
    // 4. 更新云数据库
    const db = wx.cloud.database();
    db.collection('users').doc(currentUser.id).update({ // 用update而非set，避免覆盖其他字段
      data: updateData,
      success: () => {
        console.log('云数据库信息更新成功');
        this.setData({
          userInfo: newUserInfo,
          editUserInfoShow: false
        });
        wx.showToast({ title: '信息保存成功', icon: 'success' });
      },
      fail: (err) => {
        console.error('云数据库更新失败:', err);
        wx.showToast({ title: '保存失败，请重试', icon: 'none' });
      }
    });
  },

  // 以下方法保持不变，仅格式化优化
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
      activityForm: { title: '', organizer: '', dept: '', category: '', deadline: '', difficulty: '' }
    });

    setTimeout(() => {
      let currentScore = this.data.userScore + 50;
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

    let currentScore = this.data.userScore + 5;
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
      let currentScore = this.data.userScore + 50;
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
              const scoreMap = [50, 100];
              const needScore = scoreMap[res.tapIndex];

              if (this.data.userScore < needScore) {
                wx.showToast({ title: '积分不足', icon: 'none' });
                return;
              }

              let currentScore = this.data.userScore - needScore;
              wx.setStorageSync('userScore', currentScore);
              this.setData({ userScore: currentScore });
              wx.showToast({ title: '兑换成功', icon: 'success' });
            }
          });
        }
      }
    });
  },

  openContactRequests() {
    wx.navigateTo({ url: '/pages/contact-requests/contact-requests' });
  }
});