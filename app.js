App({
  // 提取公共常量，避免重复定义
  constants: {
    DEFAULT_AVATAR: '/images/default-avatar.png',
    DEFAULT_GIFTS: [
      { id: "gift_001", name: "清华文创笔记本", needPoints: 100, stock: 99 },
      { id: "gift_002", name: "技术面试券", needPoints: 200, stock: 50 },
      { id: "gift_003", name: "编程书籍", needPoints: 300, stock: 30 }
    ],
    CLOUD_ENV: 'cloud1-6g67sh8587f55b79',
    DEFAULT_CREDIT: 80,
    DEFAULT_DEPT: '未设置',
    DEFAULT_GRADE: '未设置'
  },

  onLaunch() {
    console.log('小程序启动');
    
    // 检查云开发支持
    if (!wx.cloud) {
      console.error('请使用 2.2.3 或以上的基础库以使用云能力');
      this.setupLocalUser();
    } else {
      try {
        // 初始化云开发环境
        wx.cloud.init({
          env: this.constants.CLOUD_ENV,
          traceUser: true
        });
        console.log('云开发初始化成功');
        
        // 异步执行用户信息同步，避免阻塞启动
        this.delayInitializeUserInfo();
      } catch (error) {
        console.error('云开发初始化异常:', error);
        this.setupLocalUser();
      }
    }
  },

  // 使用Promise包装的延时执行，替代setTimeout
  delayInitializeUserInfo() {
    // 使用 Promise 包装延时操作，更符合现代JavaScript实践
    new Promise(resolve => {
      setTimeout(() => resolve(), 800);
    }).then(() => {
      this.initializeUserInfo();
    });
  },

  // 封装用户信息保存逻辑，避免重复代码
  saveUserInfo(userInfo) {
    this.globalData.userInfo = userInfo;
    wx.setStorageSync('userInfo', userInfo);
    console.log('用户信息已保存:', userInfo);
  },

  // 通用用户信息构建方法
  buildUserInfo(data = {}, isDefault = false, openid = null) {
    const db = wx.cloud && wx.cloud.database ? wx.cloud.database() : null;
    
    return {
      id: openid || (isDefault ? 'local_user_' + Date.now() : data._id),
      name: data.name || (isDefault ? '微信用户' : '本地用户'),
      avatar: this.processAvatarUrl(data.avatar),
      credit: data.credit || this.constants.DEFAULT_CREDIT,
      gender: data.gender || 0,
      dept: data.dept || this.constants.DEFAULT_DEPT,
      grade: data.grade || this.constants.DEFAULT_GRADE,
      skill: Array.isArray(data.skill) ? data.skill : [],
      contact: data.contact || {},
      wechat: data.wechat || '',
      bio: data.bio || '',
      points: data.points || 0,
      pointsRecord: Array.isArray(data.pointsRecord) ? data.pointsRecord : [],
      creditScore: data.creditScore || this.constants.DEFAULT_CREDIT,
      creditTags: Array.isArray(data.creditTags) ? data.creditTags : [],
      creditDesc: data.creditDesc || '',
      gifts: Array.isArray(data.gifts) ? data.gifts : [...this.constants.DEFAULT_GIFTS],
      createTime: data.createTime || (db ? db.serverDate() : null),
      updateTime: data.updateTime || (db ? db.serverDate() : null)
    };
  },

  // 设置本地默认用户
  setupLocalUser() {
    const defaultUserInfo = this.buildUserInfo({}, true);
    this.saveUserInfo(defaultUserInfo);
  },

  // 初始化用户信息
  initializeUserInfo() {
    try {
      this.fetchCloudUserInfo();
    } catch (error) {
      console.error('初始化用户信息失败:', error);
      this.setupLocalUser();
    }
  },

  // 从云端获取用户信息
  async fetchCloudUserInfo() {
    try {
      console.log('开始获取云端用户信息...');
      
      // 获取openid
      const res = await wx.cloud.callFunction({ name: 'getOpenid', data: {} });
      const openid = res.result.openid;
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
        const userInfo = this.buildUserInfo(result.data, false, openid);
        this.saveUserInfo(userInfo);
        console.log('云端用户信息加载成功:', userInfo);
      } else {
        console.log('云端无用户数据，创建本地用户');
        const defaultUserInfo = this.buildUserInfo({}, true, openid);
        this.saveUserInfo(defaultUserInfo);
        console.log('已创建默认用户信息:', defaultUserInfo);
      }
    } catch (error) {
      console.error('获取云端用户信息失败:', error);
      this.setupLocalUser();
    }
  },

  // 处理头像URL
  processAvatarUrl(avatarUrl) {
    if (!avatarUrl) return this.constants.DEFAULT_AVATAR;
    
    // 安全检查，确保avatarUrl是字符串类型
    if (typeof avatarUrl !== 'string') {
      return this.constants.DEFAULT_AVATAR;
    }
    
    // 清理云存储URL重复前缀
    if (avatarUrl.startsWith('cloud://')) {
      // 使用更精确的正则表达式防止潜在的安全问题
      const cleaned = avatarUrl.replace(/^cloud:\/\/[^.]+\./, 'cloud://');
      console.log('清理头像URL:', avatarUrl, '->', cleaned);
      return cleaned;
    }
    return avatarUrl;
  },

  globalData: {
    userInfo: {}
  },

  // 登录方法
  async login(userInfo) {
    try {
      // 获取微信登录code
      const wxLoginRes = await wx.login();
      if (!wxLoginRes.code) {
        console.error("获取code失败");
        return;
      }

      // 获取openid
      const cloudRes = await wx.cloud.callFunction({
        name: 'getOpenid',
        data: { code: wxLoginRes.code }
      });

      const openid = cloudRes.result.openid;
      if (!openid) {
        console.error("获取openid失败");
        return;
      }

      // 查询或创建用户记录
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
        finalUserInfo = this.buildUserInfo(userDoc.data, false, openid);
      } else {
        // 创建新用户
        const newUser = {
          name: userInfo.nickName,
          avatar: userInfo.avatarUrl,
          gender: userInfo.gender,
          city: userInfo.city,
          province: userInfo.province,
          country: userInfo.country
        };
        
        finalUserInfo = this.buildUserInfo(newUser, false, openid);

        // 写入数据库
        await db.collection('users').add({
          data: { _id: openid, ...finalUserInfo }
        });
      }

      // 保存用户信息并跳转首页
      this.saveUserInfo(finalUserInfo);
      wx.switchTab({ url: '/pages/index/index' });
      
    } catch (err) {
      console.error("登录流程失败:", err);
      wx.showToast({ title: "登录失败，请重试", icon: "none" });
    }
  }
});