// pages/mine/mine.js - 超级简化版
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
    
    // 注册头像更新监听
    const app = getApp();
    app.globalData.onAvatarUpdate = (newAvatarUrl) => {
      console.log('🔔 收到全局头像更新通知:', newAvatarUrl);
      this.refreshAvatar(newAvatarUrl);
    };
    
    this.loadEverything();
  },

  onShow: function() {
    console.log('=== 页面显示 ===');
    this.loadEverything();
  },

  onUnload: function() {
    // 取消头像更新监听
    const app = getApp();
    app.globalData.onAvatarUpdate = null;
    console.log('监听页面已卸载，取消头像监听');
  },

  // 💣 紧急强制刷新
  emergencyRefresh: function() {
    console.log('💣 执行紧急强制刷新');
    wx.showLoading({ title: '强制刷新中...' });
    
    // 清除所有缓存
    wx.clearStorageSync();
    
    // 重新加载
    setTimeout(() => {
      this.loadEverything();
      wx.hideLoading();
      wx.showToast({ title: '刷新完成', icon: 'success' });
    }, 2000);
  },

  // 🔥 强制刷新头像
  forceRefreshAvatar: function() {
    console.log('🔥 执行强制刷新头像');
    wx.showLoading({ title: '刷新头像中...' });
    
    this.loadEverything();
    
    setTimeout(() => {
      wx.hideLoading();
      wx.showToast({ title: '头像刷新完成', icon: 'success' });
    }, 1500);
  },

  // ☁️ 查看云端数据
  showCloudData: function() {
    const app = getApp();
    const currentUser = app.globalData.userInfo;
    
    if (!currentUser || !currentUser.id) {
      wx.showToast({ title: '用户未登录', icon: 'none' });
      return;
    }
    
    console.log('☁️ 查询云端数据，用户ID:', currentUser.id);
    
    const db = wx.cloud.database();
    db.collection('users').doc(currentUser.id).get({
      success: (res) => {
        console.log('✅ 云端数据:', res.data);
        wx.showModal({
          title: '云端数据',
          content: JSON.stringify(res.data, null, 2),
          showCancel: false
        });
      },
      fail: (err) => {
        console.error('❌ 查询失败:', err);
        wx.showToast({ title: '查询失败', icon: 'none' });
      }
    });
  },

  // 加载所有数据的核心方法
  loadEverything: function() {
    console.log('🔄 开始加载所有数据');
    
    // 1. 优先从本地缓存获取（最快）
    const cachedData = wx.getStorageSync('userInfo') || {};
    console.log('📱 本地缓存数据:', cachedData);
    
    // 即使有缓存也尝试刷新云端数据，确保头像最新
    this.loadFromCloud();
    
    // 2. 如果缓存中有有效数据，先显示缓存内容
    if (cachedData.name) {
      console.log('✅ 先显示本地缓存数据');
      this.setData({
        userInfo: cachedData,
        userScore: wx.getStorageSync('userScore') || 0
      });
    } else {
      // 3. 没有缓存则使用默认数据
      this.useDefaultData();
    }
    
    // 4. 更新积分
    this.setData({
      userScore: wx.getStorageSync('userScore') || 0
    });
  },

  // 从云端加载
  loadFromCloud: function() {
    const app = getApp();
    const currentUser = app.globalData.userInfo;
    
    if (!currentUser || !currentUser.id) {
      console.log('⚠️ 用户未登录');
      this.useDefaultData();
      return;
    }
    
    console.log('☁️ 从云端获取，ID:', currentUser.id);
    
    const db = wx.cloud.database();
    db.collection('users').doc(currentUser.id).get({
      success: (res) => {
        console.log('✅ 云端获取成功:', res.data);
        
        if (res.data && res.data.avatar) {
          // 处理头像
          this.processAvatar(res.data);
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

  // 处理头像
  processAvatar: function(userData) {
    const avatarUrl = userData.avatar;
    console.log('🖼️ 处理头像:', avatarUrl);
    
    if (!avatarUrl) {
      console.log('⚠️ 头像URL为空，使用默认头像');
      this.displayData({ ...userData, avatar: '/images/default-avatar.png' });
      return;
    }
    
    if (avatarUrl.startsWith('cloud://')) {
      // 云存储URL，获取临时链接
      console.log('☁️ 获取临时链接');
      wx.cloud.getTempFileURL({
        fileList: [avatarUrl],
        success: (res) => {
          console.log('☁️ 临时链接获取结果:', res);
          if (res.fileList && res.fileList[0] && res.fileList[0].tempFileURL) {
            const tempUrl = res.fileList[0].tempFileURL;
            console.log('✅ 成功获取临时URL:', tempUrl);
            this.displayData({ ...userData, avatar: tempUrl });
          } else {
            console.warn('⚠️ 未获取到有效的临时URL，使用原始URL');
            this.displayData(userData);
          }
        },
        fail: (err) => {
          console.error('❌ 获取临时链接失败:', err);
          // 失败时使用原始URL
          this.displayData(userData);
        }
      });
    } else {
      // 普通URL直接使用
      console.log('✅ 普通URL直接使用');
      this.displayData(userData);
    }
  },

  // 显示数据
  displayData: function(data) {
    console.log('📊 显示数据:', data);
    this.setData({ userInfo: data });
    
    // 更新缓存
    wx.setStorageSync('userInfo', data);
    
    // 更新全局
    const app = getApp();
    app.globalData.userInfo = data;
  },

  // 使用默认数据
  useDefaultData: function() {
    console.log('👤 使用默认数据');
    this.setData({
      userInfo: {
        name: '未登录用户',
        avatar: '/images/default-avatar.png',
        credit: 80
      }
    });
  },

  // 外部调用的刷新头像方法
  refreshAvatar: function(newAvatarUrl) {
    console.log('🔄 接收到外部头像刷新请求:', newAvatarUrl);
    
    if (newAvatarUrl) {
      // 直接更新显示
      this.setData({
        'userInfo.avatar': newAvatarUrl
      });
      
      // 更新缓存
      const currentInfo = this.data.userInfo;
      const updatedInfo = {
        ...currentInfo,
        avatar: newAvatarUrl
      };
      wx.setStorageSync('userInfo', updatedInfo);
      
      // 更新全局变量
      const app = getApp();
      app.globalData.userInfo = updatedInfo;
      
      console.log('✅ 头像刷新完成');
    }
  },

  // 编辑信息
  openEditUserInfo: function() {
    wx.navigateTo({
      url: '/pages/edit-profile/edit-profile'
    });
  },

  // 签到
  checkIn: function() {
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
  }
});