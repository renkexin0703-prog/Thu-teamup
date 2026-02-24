// pages/edit-profile/edit-profile.js
const fakeData = require("../../utils/fake-data.js");

Page({
  data: {
    userInfo: {},
    filterOptions: fakeData.filterOptions,
    name: "",
    gender: "",
    grade: "",
    department: "",  // 院系选择用的临时字段
    dept: "",        // 实际保存的字段
    skills: [],
    wechat: "",
    bio: "", 
    avatarUrl: "",
  },

  onLoad() {
    console.log('=== 编辑页面加载 ===');
    
    // 获取当前用户信息（从本地缓存优先）
    const localUserInfo = wx.getStorageSync('userInfo') || {};
    const defaultUserInfo = fakeData.userInfo;
    
    console.log('📱 本地用户信息:', localUserInfo);
    console.log('👤 默认用户信息:', defaultUserInfo);

    this.setData({
      userInfo: localUserInfo,
      name: localUserInfo.name || defaultUserInfo.name,
      gender: localUserInfo.gender || defaultUserInfo.gender,
      grade: localUserInfo.grade || defaultUserInfo.grade,
      department: localUserInfo.dept || defaultUserInfo.department,  // 显示用
      dept: localUserInfo.dept || defaultUserInfo.department,        // 保存用
      skills: Array.isArray(localUserInfo.skill) 
        ? localUserInfo.skill 
        : (localUserInfo.skill ? localUserInfo.skill.split(',') : []),
      bio: localUserInfo.bio || "", // 读取 bio
      wechat: localUserInfo.wechat || defaultUserInfo.wechat,
      avatarUrl: localUserInfo.avatar || ""
    });
    
    // 检查用户ID
    const app = getApp();
    console.log('应用查看用户信息:', app.globalData.userInfo);
    
    if (!app.globalData.userInfo || !app.globalData.userInfo.id) {
      console.warn('⚠️ 全局用户ID为空，尝试从本地缓存获取');
      if (localUserInfo.id) {
        // 同步到全局
        app.globalData.userInfo = localUserInfo;
        console.log('✅ 已同步本地用户信息到全局');
      } else {
        console.error('❌ 无法获取用户ID');
        wx.showToast({ title: '用户信息异常，请重新登录', icon: 'none' });
      }
    }
    
    // 自动加载云端头像
    this.loadCloudAvatarIfNeeded(localUserInfo.avatar);
  },

  // 新增：自动加载云端头像
  loadCloudAvatarIfNeeded(avatarUrl) {
    console.log('🔍 检测头像URL类型:', avatarUrl);
    
    if (!avatarUrl) {
      console.log('⚠️ 头像URL为空');
      this.setData({
        avatarUrl: '/images/default-avatar.png'
      });
      return;
    }
    
    if (avatarUrl.startsWith('cloud://')) {
      console.log('🔍 检测到云存储头像，获取临时URL...');
      wx.cloud.getTempFileURL({
        fileList: [avatarUrl],
        success: (res) => {
          console.log('☁️ 临时URL获取结果:', res);
          if (res.fileList && res.fileList[0] && res.fileList[0].tempFileURL) {
            const tempUrl = res.fileList[0].tempFileURL;
            this.setData({
              avatarUrl: tempUrl
            });
            // 同时更新本地缓存
            const updatedUserInfo = {
              ...this.data.userInfo,
              avatar: tempUrl
            };
            wx.setStorageSync('userInfo', updatedUserInfo);
            console.log('✅ 编辑页面头像加载成功:', tempUrl);
          } else {
            console.warn('⚠️ 未获取到有效的临时URL');
            this.setData({
              avatarUrl: avatarUrl  // 使用原始URL
            });
          }
        },
        fail: (err) => {
          console.error('❌ 加载云端头像失败:', err);
          // 失败时使用默认头像
          this.setData({
            avatarUrl: '/images/default-avatar.png'
          });
        }
      });
    } else {
      // 普通URL直接使用
      this.setData({
        avatarUrl: avatarUrl
      });
      console.log('✅ 使用普通头像URL:', avatarUrl);
    }
  },

  // 选择头像
  chooseAvatar() {
    wx.chooseImage({
      count: 1,
      sizeType: ['compressed'],
      sourceType: ['album'],
      success: (res) => {
        const tempFilePath = res.tempFilePaths[0];
        this.setData({ avatarUrl: tempFilePath });

        // ✅ 直接上传，不再裁剪
        this.uploadAvatar(tempFilePath);
      },
      fail: () => {
        console.log("选择图片失败");
      }
    });
  },

  // 上传头像到云存储
  uploadAvatar(filePath) {
    wx.showLoading({ title: '上传头像中...' });
    
    const cloudPath = `avatars/${Date.now()}_${Math.random().toString(36).substr(2, 9)}.jpg`;
    const db = wx.cloud.database();

    wx.cloud.uploadFile({
      cloudPath,
      filePath,
      success: (res) => {
        const fileID = res.fileID;
        console.log('✅ 头像上传成功，fileID:', fileID);

        // 更新本地数据
        const editForm = {
          ...this.data.userInfo,
          avatar: fileID
        };

        // 1. 保存到本地缓存
        wx.setStorageSync('userInfo', editForm);
        console.log('✅ 本地缓存更新完成');

        // 2. 同步到全局变量
        const app = getApp();
        app.globalData.userInfo = {
          ...app.globalData.userInfo,
          ...editForm
        };
        console.log('✅ 全局变量更新完成');

        // 3. 更新当前页面的 avatarUrl（用于预览）
        this.setData({ avatarUrl: fileID });
        
        // 3.1 立即获取临时URL用于显示
        this.loadCloudAvatarIfNeeded(fileID);

        // 4. 更新云数据库
        const currentUser = app.globalData.userInfo;
        if (!currentUser || !currentUser.id) {
          console.error("用户信息不完整，无法更新数据库");
          wx.hideLoading();
          wx.showToast({ title: "用户信息异常", icon: "none" });
          return;
        }

        db.collection('users').doc(currentUser.id).update({
          data: {
            avatar: fileID,
            updateTime: db.serverDate()
          },
          success: () => {
            console.log('✅ 云端数据库更新成功');
            wx.hideLoading();
            wx.showToast({ title: "头像上传成功", icon: "success" });
            
            // 通知其他页面刷新
            this.notifyAvatarUpdate(fileID);
          },
          fail: (err) => {
            console.error("云端数据库更新失败:", err);
            wx.hideLoading();
            wx.showToast({ title: "上传失败，请重试", icon: "none" });
          }
        });
      },
      fail: (err) => {
        console.error("上传失败:", err);
        wx.hideLoading();
        wx.showToast({ title: "上传失败，请重试", icon: "none" });
      }
    });
  },

  // 输入姓名
  onNameInput(e) {
    this.setData({ name: e.detail.value });
  },

  // 选择性别
  onGenderSelect(e) {
    const gender = this.data.filterOptions.gender[e.detail.value];
    this.setData({ gender });
  },

  // 选择年级
  onGradeSelect(e) {
    const grade = this.data.filterOptions.grades[e.detail.value];
    this.setData({ grade });
  },

  // 选择院系
  onDeptSelect(e) {
    const department = this.data.filterOptions.departments[e.detail.value];
    this.setData({ 
      department: department,  // 用于显示
      dept: department         // 用于保存
    });
  },

  // 选择技能
  gotoSelectSkills() {
    wx.navigateTo({
      url: `/pages/select-skills/select-skills?skills=${JSON.stringify(this.data.skills)}`
    });
  },

  onBioChange(e) {
    this.setData({ bio: e.detail.value });
  },

  // 输入微信号
  onWechatInput(e) {
    this.setData({ wechat: e.detail.value });
  },

  // 通知其他页面头像已更新
  notifyAvatarUpdate: function(newAvatarUrl) {
    console.log('📢 通知其他页面头像更新:', newAvatarUrl);
    
    // 获取当前页面栈
    const pages = getCurrentPages();
    
    // 通知 mine 页面更新
    const minePage = pages.find(page => page.route === 'pages/mine/mine');
    if (minePage) {
      console.log('📢 通知 mine 页面刷新头像');
      minePage.refreshAvatar(newAvatarUrl);
    }
    
    // 也可以通过全局事件通知
    const app = getApp();
    if (app.globalData.onAvatarUpdate) {
      app.globalData.onAvatarUpdate(newAvatarUrl);
    }
  },

  // 修改 onSubmit() 方法如下：
  onSubmit() {
    const { name, gender, grade, department, skills, wechat, bio } = this.data;

    // 简单校验
    if (!name || !gender || !grade || !department || !wechat) {
      wx.showToast({
        title: "请填写必填项",
        icon: "none"
      });
      return;
    }

    // 1. 构造要保存的数据
    const editForm = {
      name,
      gender,
      grade,
      dept: this.data.dept || department,  // 优先使用已选择的院系
      skill: skills,
      bio: bio.trim(),
      wechat: wechat.trim(),
      avatar: this.data.avatarUrl || this.data.userInfo.avatar
    };

    // 2. 保存到本地缓存
    wx.setStorageSync('userInfo', editForm);

    // 3. 同步到全局变量
    const app = getApp();
    app.globalData.userInfo = {
      ...app.globalData.userInfo,
      ...editForm
    };

    // 4. ✅ 更新云数据库：必须包含 avatar 字段
    const db = wx.cloud.database();
    const currentUser = app.globalData.userInfo;
    
    // 添加用户ID检查
    console.log('🔍 当前用户信息:', currentUser);
    
    if (!currentUser || !currentUser.id) {
      console.error('❌ 用户ID为空，无法更新数据库');
      wx.showToast({ title: '用户信息异常，请重新登录', icon: 'none' });
      return;
    }

    db.collection('users').doc(currentUser.id).update({
      data: {
        name: editForm.name,
        gender: editForm.gender,
        grade: editForm.grade,
        dept: editForm.dept,
        bio: editForm.bio,
        contact: {
          phone: editForm.contact?.phone || '',
          wechat: editForm.wechat
        },
        avatar: editForm.avatar, // ✅ 必须加上这行！
        updateTime: db.serverDate()
      },
      success: () => {
        console.log('☁️ 云数据库信息更新成功');
        // 强制刷新头像显示
        this.loadCloudAvatarIfNeeded(editForm.avatar);
        wx.showToast({ title: "保存成功！", icon: "success" });
        
        // 立即同步到所有相关页面
        setTimeout(() => {
          // 1. 更新缓存
          wx.setStorageSync('userInfo', editForm);
          
          // 2. 更新全局数据
          const app = getApp();
          app.globalData.userInfo = editForm;
          
          // 3. 直接更新 mine 页面（如果存在）
          const pages = getCurrentPages();
          const minePage = pages.find(page => page.route === 'pages/mine/mine');
          if (minePage) {
            console.log('📢 直接通知 mine 页面更新');
            minePage.setData({
              userInfo: editForm
            });
          }
          
          wx.navigateBack({ delta: 1 });
        }, 500);
      },
      fail: (err) => {
        console.error('云数据库同步失败:', err);
        wx.showToast({ title: '保存失败，请重试', icon: 'none' });
      }
    });

    // 移除重复的返回逻辑
  }
});