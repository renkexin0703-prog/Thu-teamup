// pages/mine/mine.js - 简化版头像显示解决方案
Page({
  
  data: {
    userInfo: {
      name: '加载中...',
      avatar: '/images/default-avatar.png',
      credit: 80
    },
    userScore: 0
  },

  onLoad: function() {
    console.log('=== 页面加载 ===');
    this.loadUserData();
  },

  onShow: function() {
    console.log('=== 页面显示 ===');
    this.loadUserData();
  },

  // 核心加载方法
  loadUserData: function() {
    console.log('🔄 开始加载用户数据');
    
    // 1. 优先从本地缓存获取
    const localData = wx.getStorageSync('userInfo') || {};
    console.log('📱 本地缓存数据:', localData);
    
    if (localData.avatar && localData.name) {
      this.setData({
        userInfo: localData,
        userScore: wx.getStorageSync('userScore') || 0
      });
      console.log('✅ 使用本地缓存数据');
      return;
    }
    
    // 2. 从云端获取最新数据
    this.loadFromCloud();
  },

  // 从云端加载数据
  loadFromCloud: function() {
    const app = getApp();
    const currentUser = app.globalData.userInfo;
    
    if (!currentUser || !currentUser.id) {
      console.log('⚠️ 用户未登录');
      this.useDefaultData();
      return;
    }
    
    console.log('☁️ 从云端获取用户数据，ID:', currentUser.id);
    
    const db = wx.cloud.database();
    db.collection('users').doc(currentUser.id).get({
      success: (res) => {
        console.log('✅ 云端获取成功:', res.data);
        
        if (res.data) {
          // 处理头像URL
          this.processAvatarData(res.data);
        } else {
          this.useDefaultData();
        }
      },
      fail: (err) => {
        console.error('❌ 云端获取失败:', err);
        this.useDefaultData();
      }
    });
  },

  // 处理头像数据
  processAvatarData: function(userData) {
    const avatarUrl = userData.avatar;
    console.log('🖼️ 处理头像URL:', avatarUrl);
    
    if (!avatarUrl) {
      this.displayUserData(userData);
      return;
    }
    
    // 如果是云存储URL，获取临时链接
    if (avatarUrl.startsWith('cloud://')) {
      console.log('☁️ 云存储URL，获取临时链接');
      this.getTempAvatarUrl(avatarUrl, userData);
    } else {
      // 普通URL直接使用
      console.log('✅ 普通URL直接使用');
      this.displayUserData(userData);
    }
  },

  // 获取临时头像URL
  getTempAvatarUrl: function(cloudUrl, userData) {
    wx.cloud.getTempFileURL({
      fileList: [cloudUrl],
      success: (res) => {
        console.log('✅ 临时URL获取成功:', res);
        
        if (res.fileList && res.fileList[0] && res.fileList[0].tempFileURL) {
          const tempUrl = res.fileList[0].tempFileURL;
          const updatedData = {
            ...userData,
            avatar: tempUrl
          };
          
          this.displayUserData(updatedData);
          // 同时更新缓存
          wx.setStorageSync('userInfo', updatedData);
        } else {
          this.displayUserData(userData);
        }
      },
      fail: (err) => {
        console.error('❌ 获取临时URL失败:', err);
        this.displayUserData(userData);
      }
    });
  },

  // 显示用户数据
  displayUserData: function(userData) {
    console.log('📊 显示用户数据:', userData);
    
    this.setData({
      userInfo: userData,
      userScore: wx.getStorageSync('userScore') || 0
    });
    
    // 更新全局数据
    const app = getApp();
    app.globalData.userInfo = userData;
  },

  // 使用默认数据
  useDefaultData: function() {
    console.log('👤 使用默认数据');
    
    this.setData({
      userInfo: {
        name: '未登录用户',
        avatar: '/images/default-avatar.png',
        credit: 80
      },
      userScore: 0
    });
  },

  // 刷新按钮点击事件
  refreshData: function() {
    console.log('🔄 用户点击刷新按钮');
    wx.showToast({
      title: '正在刷新...',
      icon: 'loading'
    });
    
    this.loadUserData();
    
    setTimeout(() => {
      wx.showToast({
        title: '刷新完成',
        icon: 'success'
      });
    }, 1000);
  },

  // 编辑用户信息
  openEditUserInfo: function() {
    wx.navigateTo({
      url: '/pages/edit-profile/edit-profile'
    });
  },

  // 其他原有方法...
  checkIn: function() {
    // 每日签到逻辑
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
  }
});