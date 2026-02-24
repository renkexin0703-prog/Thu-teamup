// app.js
App({
  onLaunch() {
    console.log('小程序启动');
    
    // 检查云开发支持
    if (!wx.cloud) {
      console.error('请使用 2.2.3 或以上的基础库以使用云能力');
      // 直接设置默认用户信息
      this.setupLocalUser();
    } else {
      try {
        // 初始化云开发环境
        wx.cloud.init({
          env: 'cloud1-6g67sh8587f55b79',
          traceUser: true
        });
        console.log('云开发初始化成功');
        
        // 延迟执行用户信息同步
        setTimeout(() => {
          this.initializeUserInfo();
        }, 1000);
        
      } catch (error) {
        console.error('云开发初始化异常:', error);
        this.setupLocalUser();
      }
    }
  },

  // 设置本地默认用户
  setupLocalUser() {
    const defaultUserInfo = {
      id: 'local_user_' + Date.now(),
      name: '本地用户',
      avatar: '/images/default-avatar.png',
      credit: 80,
      gender: 0,
      dept: '未设置',
      grade: '未设置',
      skill: [],
      contact: {}
    };
    
    this.globalData.userInfo = defaultUserInfo;
    wx.setStorageSync('userInfo', defaultUserInfo);
    console.log('已设置本地默认用户:', defaultUserInfo);
  },

  // 初始化用户信息
  initializeUserInfo() {
    try {
      // 优先使用本地缓存
      const cachedUser = wx.getStorageSync('userInfo');
      console.log('本地缓存用户信息:', cachedUser);
      
      if (cachedUser && cachedUser.id) {
        this.globalData.userInfo = cachedUser;
        console.log('使用本地缓存的用户信息');
      } else {
        // 尝试从云端获取
        this.fetchCloudUserInfo();
      }
    } catch (error) {
      console.error('初始化用户信息失败:', error);
      this.setupLocalUser();
    }
  },

  // 从云端获取用户信息
  async fetchCloudUserInfo() {
    try {
      console.log('开始获取云端用户信息...');
      
      // 正确方式：调用云函数获取openid
      let openidResult;
      try {
        openidResult = await wx.cloud.callFunction({
          name: 'getOpenid'
        });
        console.log('云函数调用结果:', openidResult);
      } catch (cloudErr) {
        console.error('云函数调用失败:', cloudErr);
        this.setupLocalUser();
        return;
      }
      
      const openid = openidResult.result?.openid;
      console.log('获取到openid:', openid);
      
      if (!openid) {
        console.log('无法获取openid，使用本地用户');
        this.setupLocalUser();
        return;
      }

      // 查询云数据库
      const db = wx.cloud.database();
      const result = await db.collection('users').doc(openid).get();
      console.log('云端查询结果:', result);
      
      if (result.data) {
        // 构建用户信息对象
        const userInfo = {
          id: openid,
          name: result.data.name || '微信用户',
          avatar: this.processAvatarUrl(result.data.avatar),
          credit: result.data.credit || 80,
          gender: result.data.gender || 0,
          dept: result.data.dept || '未设置',
          grade: result.data.grade || '未设置',
          skill: Array.isArray(result.data.skill) ? result.data.skill : [],
          contact: result.data.contact || {},
          createTime: result.data.createTime,
          updateTime: result.data.updateTime
        };
        
        // 保存到全局和本地
        this.globalData.userInfo = userInfo;
        wx.setStorageSync('userInfo', userInfo);
        console.log('云端用户信息加载成功:', userInfo);
      } else {
        console.log('云端无用户数据，创建本地用户');
        this.setupLocalUser();
      }
    } catch (error) {
      console.error('获取云端用户信息失败:', error);
      this.setupLocalUser();
    }
  },

  // 处理头像URL
  processAvatarUrl(avatarUrl) {
    if (!avatarUrl) return '/images/default-avatar.png';
    
    // 如果是云存储URL，清理重复前缀
    if (avatarUrl.startsWith('cloud://')) {
      const cleaned = avatarUrl.replace(/cloud:\/\/[^.]+\./, 'cloud://');
      console.log('清理头像URL:', avatarUrl, '->', cleaned);
      return cleaned;
    }
    
    return avatarUrl;
  },

  // 登录方法
  async login(userInfo) {
    try {
      // 第一步：获取微信登录code
      const loginRes = await wx.login();
      if (!loginRes.code) {
        console.error("获取code失败");
        return;
      }

      // 第二步：调用云函数获取openid
      const cloudRes = await wx.cloud.callFunction({
        name: 'getOpenid',
        data: { code: loginRes.code }
      });

      const openid = cloudRes.result.openid;
      if (!openid) {
        console.error("获取openid失败");
        return;
      }

      // 第三步：查询或创建用户记录
      const db = wx.cloud.database();
      let userDoc;
      try {
        userDoc = await db.collection('users').doc(openid).get();
      } catch (err) {
        userDoc = null;
      }

      let finalUserInfo = {};
      if (userDoc && userDoc.data) {
        // 用户已存在
        finalUserInfo = {
          id: openid,
          name: userDoc.data.name,
          avatar: userDoc.data.avatar || "/images/default-avatar.png",
          gender: userDoc.data.gender || 0,
          dept: userDoc.data.dept || "",
          grade: userDoc.data.grade || "",
          skill: userDoc.data.skill || [],
          bio: userDoc.data.bio || "",
          contact: userDoc.data.contact || {},
          createTime: userDoc.data.createTime,
          updateTime: userDoc.data.updateTime
        };
      } else {
        // 创建新用户
        finalUserInfo = {
          id: openid,
          name: userInfo.nickName,
          avatar: userInfo.avatarUrl || "/images/default-avatar.png",
          gender: userInfo.gender,
          city: userInfo.city,
          province: userInfo.province,
          country: userInfo.country,
          createTime: db.serverDate(),
          updateTime: db.serverDate()
        };

        // 写入数据库
        await db.collection('users').add({
          data: {
            _id: openid,
            ...finalUserInfo
          }
        });
      }

      // 更新全局状态和本地缓存
      this.globalData.userInfo = finalUserInfo;
      wx.setStorageSync('userInfo', finalUserInfo);

      // 跳转到首页
      wx.switchTab({ url: '/pages/index/index' });
      
    } catch (err) {
      console.error("登录流程失败:", err);
      wx.showToast({ title: "登录失败，请重试", icon: "none" });
    }
  },

  globalData: {
    userInfo: {}, // 用户信息对象
    onAvatarUpdate: null // 头像更新回调函数
  }
});