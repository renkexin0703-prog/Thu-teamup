// pages/mine/mine.js
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

  onShow() {
    console.log('=== 进入我的页面 ===');
    this.loadCurrentUserInfo();
  },

  // 替换 loadCurrentUserInfo 方法
loadCurrentUserInfo() {
  try {
    // 从本地缓存获取用户信息
    const localUserInfo = wx.getStorageSync('userInfo') || {};
    console.log('本地用户信息:', localUserInfo);
    
    if (localUserInfo && Object.keys(localUserInfo).length > 0) {
      let avatarUrl = localUserInfo.avatar || '/images/default-avatar.png';
      
      // 如果是云存储URL，获取临时访问链接
      if (avatarUrl.startsWith('cloud://')) {
        wx.cloud.getTempFileURL({
          fileList: [avatarUrl],
          success: (res) => {
            if (res.fileList && res.fileList[0] && res.fileList[0].tempFileURL) {
              this.setData({
                userInfo: { 
                  ...localUserInfo, 
                  avatar: res.fileList[0].tempFileURL 
                },
                userScore: wx.getStorageSync('userScore') || 0,
                teammatesList: wx.getStorageSync('teammates') || []
              });
              console.log('使用临时URL加载头像成功');
            }
          },
          fail: (err) => {
            console.error('获取临时URL失败:', err);
            // 失败时使用默认头像
            this.setData({
              userInfo: { 
                ...localUserInfo, 
                avatar: '/images/default-avatar.png' 
              },
              userScore: wx.getStorageSync('userScore') || 0,
              teammatesList: wx.getStorageSync('teammates') || []
            });
          }
        });
      } else {
        // 直接使用URL
        this.setData({
          userInfo: { 
            ...localUserInfo, 
            avatar: avatarUrl 
          },
          userScore: wx.getStorageSync('userScore') || 0,
          teammatesList: wx.getStorageSync('teammates') || []
        });
      }
      
      console.log('用户信息加载完成:', this.data.userInfo);
    } else {
      // 使用默认信息
      this.setData({
        userInfo: {
          name: '未登录用户',
          avatar: '/images/default-avatar.png',
          credit: 80
        },
        userScore: 0,
        teammatesList: []
      });
      console.log('使用默认用户信息');
    }
  } catch (error) {
    console.error('加载用户信息失败:', error);
    this.setData({
      userInfo: {
        name: '加载失败',
        avatar: '/images/default-avatar.png',
        credit: 80
      }
    });
  }
},
  // 新增方法：处理头像URL
  handleAvatarUrl(avatarUrl) {
    if (!avatarUrl) {
      return '/images/default-avatar.png';
    }
    
    console.log('原始头像URL:', avatarUrl);
    
    // 处理云存储URL格式问题
    if (avatarUrl.startsWith('cloud://')) {
      // 清理重复的环境ID前缀
      let cleanUrl = avatarUrl.replace(/cloud:\/\/[^.]+\./, 'cloud://');
      console.log('清理后URL:', cleanUrl);
      return cleanUrl;
    }
    
    // 处理相对路径
    if (avatarUrl.startsWith('/')) {
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
        avatar: userInfo.avatar || '/images/default-avatar.png',
        contact: {
          phone: userInfo.contact?.phone || '',
          wechat: userInfo.contact?.wechat || ''
        }
      },
      editUserInfoShow: true
    });
    console.log('编辑表单数据:', this.data.editForm);
  },

  closeEditUserInfo() {
    this.setData({ editUserInfoShow: false });
  },

  // 新增：选择头像
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

  // 新增：上传头像到云存储
  uploadAvatar(filePath) {
    const app = getApp();
    const openid = app.globalData.userInfo?.id;
    
    if (!openid) {
      wx.showToast({ title: '请先登录', icon: 'none' });
      return;
    }

    wx.showLoading({ title: '上传中...' });
    
    // 上传到云存储
    wx.cloud.uploadFile({
      cloudPath: `avatars/${openid}_${Date.now()}.png`,
      filePath: filePath,
      success: (res) => {
        // 更新表单中的头像URL
        this.setData({
          'editForm.avatar': res.fileID
        });
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

  saveUserInfo() {
    const { editForm } = this.data;
    const app = getApp();
    const currentUser = app.globalData.userInfo;
  
    // 1. 保存到本地缓存
    wx.setStorageSync('userInfo', editForm);
  
    // 2. 同步到全局变量
    app.globalData.userInfo = {
      ...currentUser,
      ...editForm,
      name: editForm.name || currentUser.name,
      avatar: editForm.avatar || currentUser.avatar
    };
  
    // 3. 强制更新云数据库（无论是否存在）
    const db = wx.cloud.database();
    db.collection('users').doc(currentUser.id).set({
      data: {
        ...editForm,
        name: editForm.name || currentUser.name,
        avatar: editForm.avatar || currentUser.avatar,
        updateTime: db.serverDate()
      },
      success: () => {
        console.log('云数据库信息更新成功');
        // 更新页面显示的用户信息
        this.setData({
          userInfo: { ...this.data.userInfo, ...editForm },
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
  },

  openContactRequests() {
    wx.navigateTo({
      url: '/pages/contact-requests/contact-requests'
    });
  }

});