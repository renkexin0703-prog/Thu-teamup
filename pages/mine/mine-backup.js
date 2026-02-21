// pages/mine/mine.js
Page({
  
  // 最简单的初始化方法
  onLoad: function() {
    console.log('=== MINEMINE 页面加载 ===');
    this.hardRefresh();
  },
  
  onShow: function() {
    console.log('=== MINEMINE 页面显示 ===');
    this.hardRefresh();
  },
  
  // 硬核刷新方法
  hardRefresh: function() {
    console.log('💥 执行硬核刷新');
    
    // 直接从编辑页面获取最新数据
    const editData = wx.getStorageSync('userInfo') || {};
    console.log('📱 编辑页面数据:', editData);
    
    // 强制更新所有字段，包括院系
    if (editData.name || editData.gender || editData.dept || editData.avatar) {
      this.setData({
        userInfo: editData
      });
      console.log('✅ 硬核显示成功:', {
        name: editData.name,
        dept: editData.dept,
        avatar: editData.avatar
      });
    } else {
      // 从云端强制获取
      this.forceCloudFetch();
    }
  },
  
  // 强制云端获取
  forceCloudFetch: function() {
    const app = getApp();
    const user = app.globalData.userInfo;
    
    if (user && user.id) {
      console.log('☁️ 强制从云端获取，用户ID:', user.id);
      const db = wx.cloud.database();
      db.collection('users').doc(user.id).get({
        success: (res) => {
          console.log('✅ 云端获取成功:', res.data);
          if (res.data && res.data.avatar) {
            // 强制显示
            this.setData({
              userInfo: res.data
            });
            // 强制缓存
            wx.setStorageSync('userInfo', res.data);
            console.log('✅ 强制显示完成:', res.data.avatar);
          }
        },
        fail: (err) => {
          console.error('❌ 云端获取失败:', err);
        }
      });
    }
  },
  
  // 直接显示方法
  testDirectShow: function() {
    console.log('🎯 执行 testDirectShow');
    
    // 直接从缓存获取并显示
    const cacheData = wx.getStorageSync('userInfo') || {};
    console.log('📱 缓存数据:', cacheData);
    
    if (cacheData.avatar) {
      this.setData({
        userInfo: cacheData
      });
      console.log('✅ 直接显示缓存头像:', cacheData.avatar);
    } else {
      // 从云端获取
      this.fetchFromCloud();
    }
  },
  
  // 从云端获取
  fetchFromCloud: function() {
    const app = getApp();
    const user = app.globalData.userInfo;
    
    if (user && user.id) {
      const db = wx.cloud.database();
      db.collection('users').doc(user.id).get({
        success: (res) => {
          console.log('☁️ 云端数据:', res.data);
          if (res.data && res.data.avatar) {
            this.setData({
              userInfo: res.data
            });
            wx.setStorageSync('userInfo', res.data);
            console.log('✅ 显示云端头像:', res.data.avatar);
          }
        }
      });
    }
  },
  
  // 手动刷新按钮
  manualRefresh: function() {
    console.log('🎯 用户点击手动刷新');
    this.testDirectShow();
  },
  
  // 个人信息卡片上的刷新按钮
  refreshUserInfo: function() {
    console.log('🔄 用户点击个人信息刷新按钮');
    wx.showToast({ title: '正在刷新...', icon: 'loading' });
    this.testDirectShow();
    setTimeout(() => {
      wx.showToast({ title: '刷新完成', icon: 'success' });
    }, 1000);
  },

  data: {
    __isDebugMode: true, // 调试模式开关
    userInfo: {}, // 空对象，避免默认值覆盖云端数据
    refreshCount: 0, // 刷新计数器
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
    console.log('=== 页面加载开始 ===');
    console.log('🚀 执行 onLoad 中的 getFreshAvatarUrl');
    // 页面加载时获取新鲜头像
    this.getFreshAvatarUrl();
    this.initializeUserData();
    console.log('=== 页面加载结束 ===');
  },
  
  onShow() {
    console.log('=== 页面显示开始 ===');
    this.data.refreshCount++;
    console.log('监听页面显示 - onShow触发，第', this.data.refreshCount, '次');
    console.log('🚀 执行 getFreshAvatarUrl 方法');
    // 终极解决方案：强制重新获取有效链接
    this.getFreshAvatarUrl();
    console.log('=== 页面显示结束 ===');
  },
  
  // 获取新鲜有效的头像URL
  getFreshAvatarUrl() {
    console.log('🔍 开始执行 getFreshAvatarUrl');
    const app = getApp();
    const currentUser = app.globalData.userInfo;
    
    console.log('📱 当前用户信息:', currentUser);
    
    if (!currentUser || !currentUser.id) {
      console.log('⚠️ 用户未登录或无ID');
      this.useDefaultAvatar();
      return;
    }
    
    console.log('☁️ 准备从云端获取用户数据，ID:', currentUser.id);
    
    // 直接从云端获取最新数据
    const db = wx.cloud.database();
    db.collection('users').doc(currentUser.id).get({
      success: (res) => {
        console.log('✅ 云端获取成功:', res.data);
        if (res.data && res.data.avatar) {
          const avatarUrl = res.data.avatar;
          console.log('☁️ 获取到云端头像URL:', avatarUrl);
          
          // 如果是云存储URL，获取临时链接
          if (avatarUrl.startsWith('cloud://')) {
            console.log('🔄 检测到云存储URL，获取临时链接');
            this.getCloudTempUrl(avatarUrl, res.data);
          } else {
            // 普通URL直接使用
            console.log('✅ 普通URL直接使用');
            this.setData({
              userInfo: res.data
            });
            wx.setStorageSync('userInfo', res.data);
            console.log('✅ 使用云端头像:', avatarUrl);
          }
        } else {
          console.log('⚠️ 云端无头像数据');
          this.useDefaultAvatar();
        }
      },
      fail: (err) => {
        console.error('❌ 云端获取失败:', err);
        this.useDefaultAvatar();
      }
    });
  },
  
  // 获取云存储临时URL
  getCloudTempUrl(cloudUrl, userData) {
    console.log('🔄 开始获取云存储临时URL:', cloudUrl);
    wx.cloud.getTempFileURL({
      fileList: [cloudUrl],
      success: (res) => {
        console.log('✅ 临时URL获取成功:', res);
        if (res.fileList && res.fileList[0] && res.fileList[0].tempFileURL) {
          const freshUrl = res.fileList[0].tempFileURL;
          const updatedData = { ...userData, avatar: freshUrl };
          
          this.setData({
            userInfo: updatedData
          });
          wx.setStorageSync('userInfo', updatedData);
          console.log('✅ 获取新鲜临时URL成功:', freshUrl);
        } else {
          console.log('⚠️ 未获取到有效的临时URL');
          this.useDefaultAvatar();
        }
      },
      fail: (err) => {
        console.error('❌ 获取临时URL失败:', err);
        this.useDefaultAvatar();
      }
    });
  },
  
  // 强制数据同步方法
  forceDataSync() {
    console.log('⚡ 执行强制数据同步');
    
    // 1. 直接从本地缓存获取最新数据
    const latestUserInfo = wx.getStorageSync('userInfo') || {};
    console.log('📱 本地缓存数据:', latestUserInfo);
    
    if (latestUserInfo.avatar) {
      console.log('✅ 使用本地缓存头像:', latestUserInfo.avatar);
      this.setData({
        userInfo: latestUserInfo
      });
      return;
    }
    
    // 2. 如果本地没有，从云端获取
    this.loadCurrentUserAvatar();
  },
  
  // 初始化用户数据
  initializeUserData() {
    this.loadCurrentUserAvatar();
    this.setData({
      userScore: wx.getStorageSync('userScore') || 0
    });
  },
  
  // 刷新用户数据
  refreshUserData() {
    console.log('🔄 开始刷新用户数据');
    
    // 1. 首先检查本地缓存是否有更新
    const localCache = wx.getStorageSync('userInfo') || {};
    console.log('📱 本地缓存数据:', localCache);
    
    if (localCache.avatar && localCache.avatar !== this.data.userInfo.avatar) {
      console.log('⚡ 检测到本地缓存更新，优先使用');
      this.setData({
        userInfo: localCache
      });
    }
    
    // 2. 总是调用核心加载方法确保获取最新数据
    this.loadCurrentUserAvatar();
    
    this.setData({
      userScore: wx.getStorageSync('userScore') || 0
    });
  },

  // 专门处理头像加载的核心方法
  loadCurrentUserAvatar() {
    try {
      console.log('🔄 开始加载当前用户头像');
      
      // 直接从云端获取最新用户信息
      const app = getApp();
      const currentUser = app.globalData.userInfo;
      
      console.log('📱 全局用户信息:', currentUser);
      
      if (!currentUser || !currentUser.id) {
        console.log('⚠️ 用户未登录');
        this.useDefaultAvatar();
        return;
      }
      
      console.log('☁️ 从云端获取用户信息，ID:', currentUser.id);
      
      const db = wx.cloud.database();
      db.collection('users').doc(currentUser.id).get({
        success: (res) => {
          console.log('☁️ 云端获取成功:', res.data);
          console.log('🖼️ 云端头像URL:', res.data?.avatar);
          
          if (res.data && res.data.avatar) {
            const avatarUrl = res.data.avatar;
            
            // 检查是否为云存储URL需要获取临时链接
            if (avatarUrl.startsWith('cloud://')) {
              console.log('☁️ 检测到云存储URL，获取临时链接');
              this.getFreshTempUrl(avatarUrl, res.data);
            } else {
              // 普通URL直接使用（但需要验证有效性）
              this.validateAndSetAvatar(res.data);
            }
          } else {
            console.log('⚠️ 云端无头像数据');
            this.useDefaultAvatar();
          }
        },
        fail: (err) => {
          console.error('❌ 云端获取失败:', err);
          this.useDefaultAvatar();
        }
      });
      
    } catch (error) {
      console.error('❌ 加载头像失败:', error);
      this.useDefaultAvatar();
    }
  },
  
  // 获取新鲜的临时URL
  getFreshTempUrl(cloudUrl, userData) {
    wx.cloud.getTempFileURL({
      fileList: [cloudUrl],
      success: (res) => {
        console.log('☁️ 临时URL获取成功:', res);
        if (res.fileList && res.fileList[0] && res.fileList[0].tempFileURL) {
          const freshUrl = res.fileList[0].tempFileURL;
          const updatedData = { ...userData, avatar: freshUrl };
          
          this.setData({ userInfo: updatedData });
          wx.setStorageSync('userInfo', updatedData);
          console.log('✅ 使用新鲜临时URL:', freshUrl);
        } else {
          this.useDefaultAvatar();
        }
      },
      fail: (err) => {
        console.error('❌ 获取临时URL失败:', err);
        this.useDefaultAvatar();
      }
    });
  },
  
  // 验证并设置头像（处理过期的签名URL）
  validateAndSetAvatar(userData) {
    const avatarUrl = userData.avatar;
    console.log('🔍 验证头像URL有效性:', avatarUrl);
    
    // 创建图片对象测试URL有效性
    const img = wx.createImage();
    img.onload = () => {
      // URL有效，直接使用
      this.setData({ userInfo: userData });
      wx.setStorageSync('userInfo', userData);
      console.log('✅ 头像URL验证通过');
    };
    
    img.onerror = () => {
      // URL失效，如果是云存储URL则重新获取
      if (avatarUrl.includes('tcb.qcloud.la') && avatarUrl.includes('sign=')) {
        console.log('⚠️ 签名URL已过期，尝试重新获取');
        // 存储原始云文件ID用于重新获取
        const originalCloudId = this.extractCloudId(avatarUrl);
        if (originalCloudId) {
          this.getFreshTempUrl(originalCloudId, userData);
        } else {
          this.useDefaultAvatar();
        }
      } else {
        this.useDefaultAvatar();
      }
    };
    
    img.src = avatarUrl;
  },
  
  // 从签名URL中提取云文件ID
  extractCloudId(signedUrl) {
    // 简单提取逻辑，可根据实际URL格式调整
    try {
      const urlObj = new URL(signedUrl);
      const pathParts = urlObj.pathname.split('/');
      const fileName = pathParts[pathParts.length - 1];
      const cloudId = `cloud://cloud1-6g67sh8587f55b79.636c-cloud1-6g67sh8587f55b79-1400634517/avatars/${fileName}`;
      console.log('📤 提取的云文件ID:', cloudId);
      return cloudId;
    } catch (error) {
      console.error('❌ 提取云文件ID失败:', error);
      return null;
    }
  },

  
  // 更新用户信息显示
  updateUserInfoDisplay(userInfo, avatarUrl) {
    this.setData({
      userInfo: {
        ...userInfo,
        avatar: avatarUrl
      }
    });
    console.log('📊 页面数据已更新:', this.data.userInfo);
  },

  // 获取云存储头像的临时URL
  getCloudAvatarTempUrl(cloudUrl, userInfo) {
    wx.cloud.getTempFileURL({
      fileList: [cloudUrl],
      success: (res) => {
        console.log('☁️ 临时URL获取成功:', res);
        if (res.fileList && res.fileList[0] && res.fileList[0].tempFileURL) {
          const tempUrl = res.fileList[0].tempFileURL;
          
          // 更新页面显示
          this.updateUserInfoDisplay(userInfo, tempUrl);
          
          // 同时更新本地缓存（存储临时URL）
          const updatedUserInfo = {
            ...userInfo,
            avatar: tempUrl
          };
          wx.setStorageSync('userInfo', updatedUserInfo);
          
          console.log('✅ 云端头像显示更新完成');
        } else {
          console.warn('⚠️ 未获取到有效的临时URL');
          this.useDefaultAvatar();
        }
      },
      fail: (err) => {
        console.error('❌ 获取临时URL失败:', err);
        this.useDefaultAvatar();
      }
    });
  },
  // 使用默认头像
  useDefaultAvatar() {
    this.setData({
      userInfo: {
        name: '未登录用户',
        avatar: '/images/default-avatar.png',
        credit: 80
      }
    });
    console.log('👤 使用默认头像');
  },
    
  openEditUserInfo() {
    // 强制刷新用户信息
    this.loadCurrentUserAvatar();
    
    const { userInfo } = this.data;
    console.log('🔄 打开编辑界面，当前用户信息:', userInfo);
    
    // 确保有有效的头像URL
    const avatarUrl = userInfo.avatar || '/images/default-avatar.png';
    console.log('🖼️ 编辑界面使用的头像URL:', avatarUrl);
    
    this.setData({
      editForm: {
        name: userInfo.name || '',
        gender: userInfo.gender || '',
        grade: userInfo.grade || '',
        dept: userInfo.dept || '',
        skill: userInfo.skill || '',
        avatar: avatarUrl,
        contact: {
          phone: userInfo.contact?.phone || '',
          wechat: userInfo.contact?.wechat || ''
        }
      },
      editUserInfoShow: true
    });
    console.log('📝 编辑表单数据:', this.data.editForm);
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
    const openid = app.globalData.userInfo?.id || wx.getStorageSync('openid');
    
    if (!openid) {
      wx.showToast({ title: '请先登录', icon: 'none' });
      return;
    }

    wx.showLoading({ title: '上传中...' });
    
    // 生成唯一的文件名
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substr(2, 9);
    const fileName = `${openid}_${timestamp}_${randomStr}.png`;
    
    // 上传到云存储
    wx.cloud.uploadFile({
      cloudPath: `avatars/${fileName}`,
      filePath: filePath,
      success: (res) => {
        console.log('头像上传成功:', res.fileID);
        // 更新表单中的头像URL
        this.setData({
          'editForm.avatar': res.fileID
        });
        wx.hideLoading();
        wx.showToast({ title: '头像上传成功', icon: 'success' });
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
    
    console.log('💾 开始保存用户信息:', editForm);
    console.log('🆔 当前用户ID:', currentUser?.id);
  
    // 1. 保存到本地缓存
    wx.setStorageSync('userInfo', editForm);
    console.log('💾 本地缓存已更新');
  
    // 2. 同步到全局变量
    const updatedUserInfo = {
      ...currentUser,
      ...editForm,
      name: editForm.name || currentUser.name,
      avatar: editForm.avatar || currentUser.avatar
    };
    app.globalData.userInfo = updatedUserInfo;
    console.log('💾 全局变量已更新');
  
    // 3. 强制更新云数据库（无论是否存在）
    const db = wx.cloud.database();
    const userId = currentUser?.id || 'unknown_user';
    
    db.collection('users').doc(userId).set({
      data: {
        ...editForm,
        name: editForm.name || currentUser.name,
        avatar: editForm.avatar || currentUser.avatar,
        updateTime: db.serverDate()
      },
      success: () => {
        console.log('☁️ 云数据库信息更新成功');
        // 关键：多重保障确保头像显示
        this.forceRefreshAvatar(editForm.avatar);
        
        this.setData({
          editUserInfoShow: false
        });
        wx.showToast({ title: '信息保存成功', icon: 'success' });
      },
      fail: (err) => {
        console.error('❌ 云数据库更新失败:', err);
        wx.showToast({ title: '保存失败，请重试', icon: 'none' });
      }
    });
  },
  
  // 强制刷新头像显示
  forceRefreshAvatar(avatarUrl) {
    console.log('⚡ 强制刷新头像:', avatarUrl);
    
    // 立即更新页面显示
    this.setData({
      'userInfo.avatar': avatarUrl
    });
    
    // 延迟双重保险
    setTimeout(() => {
      this.loadCurrentUserAvatar();
    }, 300);
    
    setTimeout(() => {
      this.loadCurrentUserAvatar();
    }, 1000);
  },
  
  // 调试用的强制刷新方法
  debugRefresh() {
    console.log('🔧 执行调试刷新');
    this.loadCurrentUserAvatar();
    wx.showToast({ title: '已强制刷新', icon: 'success' });
  },
  
  // 从编辑页面强制同步数据
  forceSyncFromEdit() {
    console.log('⚡ 从编辑页面强制同步数据');
    // 直接从本地缓存获取最新数据
    const editData = wx.getStorageSync('userInfo') || {};
    console.log('📱 编辑页面数据:', editData);
    
    if (editData.avatar) {
      this.setData({
        userInfo: editData
      });
      wx.showToast({ title: '同步成功', icon: 'success' });
      console.log('✅ 已同步编辑页面数据');
    } else {
      wx.showToast({ title: '无可用数据', icon: 'none' });
    }
  },
  
  // 测试云函数调用
  testCloudFunction() {
    wx.cloud.callFunction({
      name: 'getOpenid',
      success: (res) => {
        console.log('✅ 云函数测试成功:', res.result);
        wx.showToast({ title: '云函数正常', icon: 'success' });
      },
      fail: (err) => {
        console.error('❌ 云函数测试失败:', err);
        wx.showToast({ title: '云函数异常', icon: 'none' });
      }
    });
  },
  
  // 手动测试方法
  manualTest() {
    console.log('🎯 用户点击手动测试按钮');
    this.getFreshAvatarUrl();
    wx.showToast({ title: '执行测试', icon: 'success' });
  },

  // 其他方法保持不变...
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