// app.js
App({
  onLaunch() {
    if (!wx.cloud) {
      console.error('请使用 2.2.3 或以上的基础库以使用云能力');
    } else {
      wx.cloud.init({
        env: 'cloud1-6g67sh8587f55b79',
        traceUser: true
      });
    }

    // 1. 先尝试从本地缓存获取用户信息
    const localUserInfo = wx.getStorageSync('userInfo') || {};

    // 2. 如果本地缓存为空，则从云数据库获取
    if (!localUserInfo.id) {
      this.syncUserInfoFromCloud();
    } else {
      // 否则直接使用本地缓存的数据
      this.globalData.userInfo = localUserInfo;
    }
  },

  // 从云数据库同步用户信息
  async syncUserInfoFromCloud() {
    try {
      const openid = this.globalData.userInfo?.id;
      if (!openid) return;

      const db = wx.cloud.database();
      const userDoc = await db.collection('users').doc(openid).get();

      if (userDoc.data) {
        const userInfo = {
          id: openid,
          name: userDoc.data.name || "微信用户",
          avatar: userDoc.data.avatar || "",
          gender: userDoc.data.gender || 0,
          dept: userDoc.data.dept || "",
          grade: userDoc.data.grade || "",
          skill: userDoc.data.skill || "",
          contact: userDoc.data.contact || {},
          createTime: userDoc.data.createTime,
          updateTime: userDoc.data.updateTime
        };

        // 更新全局变量和本地缓存
        this.globalData.userInfo = userInfo;
        wx.setStorageSync('userInfo', userInfo);
      }
    } catch (err) {
      console.error("从云数据库同步用户信息失败:", err);
    }
  },

  globalData: {
    userInfo: {}
  },

  async login() {
    try {
      // 第一步：调用微信登录获取 code
      const loginRes = await wx.login();
      if (!loginRes.code) {
        console.error("获取 code 失败");
        return;
      }

      // 第二步：调用云函数 getOpenid 获取 openid
      const cloudRes = await wx.cloud.callFunction({
        name: 'getOpenid',
        data: { code: loginRes.code }
      });

      const openid = cloudRes.result.openid;
      if (!openid) {
        console.error("获取 openid 失败");
        return;
      }

      // 第三步：从云数据库 users 集合中查询该用户
      const db = wx.cloud.database();
      const userDoc = await db.collection('users').doc(openid).get();

      let userInfo = {};
      if (userDoc.data) {
        // 用户存在 → 使用数据库中的 name 和 avatar
        userInfo = {
          id: openid,
          name: userDoc.data.name,
          avatar: userDoc.data.avatar || "",
          gender: userDoc.data.gender || 0,
          dept: userDoc.data.dept || "",
          grade: userDoc.data.grade || "",
          skill: userDoc.data.skill || "",
          contact: userDoc.data.contact || {},
          createTime: userDoc.data.createTime,
          updateTime: userDoc.data.updateTime
        };
      } else {
        // 用户不存在 → 使用微信授权信息
        const profileRes = await wx.getUserProfile({
          desc: '用于完善会员资料'
        });
        userInfo = {
          id: openid,
          name: profileRes.userInfo.nickName,
          avatar: profileRes.userInfo.avatarUrl,
          gender: profileRes.userInfo.gender,
          city: profileRes.userInfo.city,
          province: profileRes.userInfo.province,
          country: profileRes.userInfo.country
        };

        // 写入云数据库
        await db.collection('users').add({
          data: {
            _id: openid,
            name: userInfo.name,
            avatar: userInfo.avatar,
            gender: userInfo.gender,
            city: userInfo.city,
            province: userInfo.province,
            country: userInfo.country,
            createTime: db.serverDate()
          }
        });
      }

      // 4. 更新全局变量和本地缓存
      this.globalData.userInfo = userInfo;
      wx.setStorageSync('userInfo', userInfo);

      // 5. 跳转首页
      wx.switchTab({ url: '/pages/index/index' });
    } catch (err) {
      console.error("登录失败:", err);
      wx.showToast({ title: "登录失败，请重试", icon: "none" });
    }
  }
});