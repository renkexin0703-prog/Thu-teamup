// pages/edit-profile/edit-profile.js
const fakeData = require("../../utils/fake-data.js");
// ✅ 新增：获取App实例（全局可用）
const app = getApp();

Page({
  data: {
    userInfo: {},
    filterOptions: fakeData.filterOptions,
    name: "",
    gender: "",
    grade: "",
    department: "",
    skills: [],
    wechat: "",
    bio: "", 
    avatarUrl: "",
  },

  onLoad() {
    // 获取当前用户信息（从本地缓存优先）
    const localUserInfo = wx.getStorageSync('userInfo') || {};
    const defaultUserInfo = fakeData.userInfo;

    this.setData({
      userInfo: localUserInfo,
      name: localUserInfo.name || defaultUserInfo.name,
      gender: localUserInfo.gender || defaultUserInfo.gender,
      grade: localUserInfo.grade || defaultUserInfo.grade,
      department: localUserInfo.dept || defaultUserInfo.department,
      skills: Array.isArray(localUserInfo.skill) 
        ? localUserInfo.skill 
        : (localUserInfo.skill ? localUserInfo.skill.split(',') : []),
      bio: localUserInfo.bio || "", // 读取 bio
      wechat: localUserInfo.wechat || defaultUserInfo.wechat,
      avatarUrl: localUserInfo.avatar || ""
    });
  },

  // 选择头像（使用云函数上传方案）
  chooseAvatar() {
    wx.chooseImage({
      count: 1,
      sizeType: ['compressed'],
      sourceType: ['album'],
      success: (res) => {
        const tempFilePath = res.tempFilePaths[0];
        this.setData({ avatarUrl: tempFilePath });

        // 使用云函数上传方案
        this.uploadAvatarByCloudFunction(tempFilePath);
      },
      fail: () => {
        console.log("选择图片失败");
      }
    });
  },

  // 保存头像到本地
  saveAvatarLocally(filePath) {
    console.log("保存头像到本地，文件路径:", filePath);
    // 使用本地路径作为头像
    const editForm = {
      ...this.data.userInfo,
      avatar: filePath
    };
    // 保存到本地缓存
    wx.setStorageSync('userInfo', editForm);
    // 同步到全局变量
    app.globalData.userInfo = {
      ...app.globalData.userInfo,
      ...editForm
    };
    // 更新当前页面的 avatarUrl
    this.setData({ avatarUrl: filePath });
    wx.showToast({ title: "头像上传成功", icon: "success" });
  },

  // ✅ 新增：通过云函数上传头像（替代原直接上传）
  uploadAvatarByCloudFunction(filePath) {
    console.log("开始通过云函数上传头像，文件路径:", filePath);
    // 1. 显示加载中
    wx.showLoading({ title: '上传头像中...' });

    // 2. 构造云存储路径（用用户ID区分，避免重名）
    const userId = app.globalData.userInfo.id || `temp_${Date.now()}`;
    const cloudPath = `avatars/${userId}/${Date.now()}_${Math.random().toString(36).substr(2, 9)}.jpg`;

    // 3. 直接使用云存储上传
    wx.cloud.uploadFile({
      cloudPath: cloudPath,
      filePath: filePath,
      success: (res) => {
        console.log("云存储上传成功，fileID:", res.fileID);
        const fileID = res.fileID;
        this.handleAvatarUploadSuccess(fileID);
      },
      fail: (err) => {
        console.error("云存储上传失败:", err);
        // 即使遇到权限错误，也尝试更新数据库，使用本地路径作为临时解决方案
        this.handleAvatarUploadFail(filePath, err);
      },
      complete: () => {
        wx.hideLoading();
      }
    });
  },

  // ✅ 封装：上传成功后的统一处理（复用原有逻辑）
  handleAvatarUploadSuccess(fileID) {
    const db = wx.cloud.database();
    // 更新本地数据（原有逻辑完全复用）
    const editForm = {
      ...this.data.userInfo,
      avatar: fileID
    };

    // 1. 保存到本地缓存
    wx.setStorageSync('userInfo', editForm);
    console.log("本地缓存更新成功");

    // 2. 同步到全局变量
    app.globalData.userInfo = {
      ...app.globalData.userInfo,
      ...editForm
    };
    console.log("全局变量更新成功");

    // 3. 更新当前页面的 avatarUrl（用于预览）
    this.setData({ avatarUrl: fileID });
    console.log("页面 avatarUrl 更新成功");

    // 4. 更新云数据库（原有逻辑完全复用）
    const currentUser = app.globalData.userInfo;
    const userId = currentUser.id || currentUser._id || currentUser._openid;
    console.log("获取到的用户ID:", userId);
    
    if (!userId) {
      console.error("用户 ID 不存在，无法更新数据库");
      wx.showToast({ title: "头像上传成功（本地）", icon: "success" });
      return;
    }

    db.collection('users').doc(userId).update({
      data: {
        avatar: fileID,
        updateTime: db.serverDate()
      },
      success: () => {
        console.log("云数据库头像更新成功");
        wx.showToast({ title: "头像上传成功", icon: "success" });
      },
      fail: (err) => {
        console.error("云数据库头像更新失败:", err);
        wx.showToast({ title: "头像上传成功（本地）", icon: "success" });
      }
    });
  },

  // ✅ 封装：上传失败后的统一处理（复用原有逻辑）
  handleAvatarUploadFail(filePath, err) {
    console.error("云函数上传头像失败，降级为本地路径:", err);
    // 使用本地路径作为头像（临时解决方案）
    const editForm = {
      ...this.data.userInfo,
      avatar: filePath
    };
    // 保存到本地缓存
    wx.setStorageSync('userInfo', editForm);
    // 同步到全局变量
    app.globalData.userInfo = {
      ...app.globalData.userInfo,
      ...editForm
    };
    // 更新当前页面的 avatarUrl
    this.setData({ avatarUrl: filePath });
    
    // 尝试更新云数据库，即使使用本地路径
    const db = wx.cloud.database();
    const currentUser = app.globalData.userInfo;
    const userId = currentUser.id || currentUser._id || currentUser._openid;
    
    if (userId) {
      db.collection('users').doc(userId).update({
        data: {
          avatar: filePath,
          updateTime: db.serverDate()
        },
        success: () => {
          console.log("云数据库头像更新成功（使用本地路径）");
        },
        fail: (err) => {
          console.error("云数据库头像更新失败:", err);
        }
      });
    }
    
    wx.showToast({ title: "头像上传成功（本地）", icon: "success" });
  },

  // ❗ 保留原有上传方法（备用，可删除，也可保留）
  uploadAvatar(filePath) {
    console.log("开始上传头像，文件路径:", filePath);
    const cloudPath = `avatars/${Date.now()}_${Math.random().toString(36).substr(2, 9)}.jpg`;
    const db = wx.cloud.database();

    wx.showLoading({ title: '上传头像中...' });

    wx.cloud.uploadFile({
      cloudPath,
      filePath,
      success: (res) => {
        console.log("云存储上传成功，fileID:", res.fileID);
        const fileID = res.fileID;

        // 更新本地数据
        const editForm = {
          ...this.data.userInfo,
          avatar: fileID
        };

        // 1. 保存到本地缓存
        wx.setStorageSync('userInfo', editForm);
        console.log("本地缓存更新成功");

        // 2. 同步到全局变量
        const app = getApp();
        app.globalData.userInfo = {
          ...app.globalData.userInfo,
          ...editForm
        };
        console.log("全局变量更新成功");

        // 3. 更新当前页面的 avatarUrl（用于预览）
        this.setData({ avatarUrl: fileID });
        console.log("页面 avatarUrl 更新成功");

        // 4. 更新云数据库
        const currentUser = app.globalData.userInfo;
        console.log("当前用户信息:", currentUser);
        const userId = currentUser.id || currentUser._id || currentUser._openid;
        console.log("获取到的用户ID:", userId);
        
        if (!userId) {
          console.error("用户 ID 不存在，无法更新数据库");
          wx.hideLoading();
          wx.showToast({ title: "头像上传成功（本地）", icon: "success" });
          return;
        }

        console.log("开始更新云数据库，用户ID:", userId);
        db.collection('users').doc(userId).update({
        data: {
          avatar: fileID,
          updateTime: db.serverDate()
        },
        success: () => {
          console.log("云数据库更新成功");
          wx.hideLoading();
          wx.showToast({ title: "头像上传成功", icon: "success" });
        },
        fail: (err) => {
          console.error("云数据库更新失败:", err);
          wx.hideLoading();
          wx.showToast({ title: "头像上传成功（本地）", icon: "success" });
        }
      });
    },
    fail: (err) => {
      console.error("云存储上传失败:", err);
      wx.hideLoading();
      // 检查是否是权限错误
      if (err.errCode === -503002 || err.errMsg.includes('permission denied') || err.errMsg.includes('access right')) {
        console.error("云存储权限错误，使用本地存储");
        // 使用本地路径作为头像（临时解决方案）
        const editForm = {
          ...this.data.userInfo,
          avatar: filePath
        };
        // 保存到本地缓存
        wx.setStorageSync('userInfo', editForm);
        // 同步到全局变量
        const app = getApp();
        app.globalData.userInfo = {
          ...app.globalData.userInfo,
          ...editForm
        };
        // 更新当前页面的 avatarUrl
        this.setData({ avatarUrl: filePath });
        wx.showToast({ title: "头像上传成功（本地）", icon: "success" });
      } else if (err.errCode === -504001 || err.errMsg.includes('500 Internal Server Error')) {
        console.error("云存储服务器错误，使用本地存储");
        // 使用本地路径作为头像
        const editForm = {
          ...this.data.userInfo,
          avatar: filePath
        };
        // 保存到本地缓存
        wx.setStorageSync('userInfo', editForm);
        // 同步到全局变量
        const app = getApp();
        app.globalData.userInfo = {
          ...app.globalData.userInfo,
          ...editForm
        };
        // 更新当前页面的 avatarUrl
        this.setData({ avatarUrl: filePath });
        wx.showToast({ title: "头像上传成功（本地）", icon: "success" });
      } else {
        wx.showToast({ title: "上传失败，请重试", icon: "none" });
      }
    }
  });
  },

  // 输入姓名（原有逻辑不变）
  onNameInput(e) {
    this.setData({ name: e.detail.value });
  },

  // 选择性别（原有逻辑不变）
  onGenderSelect(e) {
    const gender = this.data.filterOptions.gender[e.detail.value];
    this.setData({ gender });
  },

  // 选择年级（原有逻辑不变）
  onGradeSelect(e) {
    const grade = this.data.filterOptions.grades[e.detail.value];
    this.setData({ grade });
  },

  // 选择院系（原有逻辑不变）
  onDeptSelect(e) {
    const department = this.data.filterOptions.departments[e.detail.value];
    this.setData({ department });
  },

  // 选择技能（原有逻辑不变）
  gotoSelectSkills() {
    wx.navigateTo({
      url: `/pages/select-skills/select-skills?skills=${JSON.stringify(this.data.skills)}`
    });
  },

  // 编辑个性签名（原有逻辑不变）
  onBioChange(e) {
    this.setData({ bio: e.detail.value });
  },

  // 输入微信号（原有逻辑不变）
  onWechatInput(e) {
    this.setData({ wechat: e.detail.value });
  },

  // 提交表单（原有逻辑完全不变）
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
      dept: department,
      skill: skills,
      bio: bio.trim(),
      wechat: wechat.trim(),
      avatar: this.data.avatarUrl || this.data.userInfo.avatar // ✅ 关键：使用新上传的 avatarUrl
    };

    // 2. 保存到本地缓存
    wx.setStorageSync('userInfo', editForm);

    // 3. 同步到全局变量
    const app = getApp();
    app.globalData.userInfo = {
      ...app.globalData.userInfo,
      ...editForm
    };

    // 4. 更新云数据库：必须包含 avatar 字段
    const db = wx.cloud.database();
    const currentUser = app.globalData.userInfo;

    db.collection('users').doc(currentUser.id).update({
      data: {
        name: editForm.name,
        gender: editForm.gender,
        grade: editForm.grade,
        dept: editForm.dept,
        department: department, // 同时保存为 department 字段，确保兼容性
        bio: editForm.bio,
        wechat: editForm.wechat, // 单独保存 wechat 字段
        contact: {
          phone: editForm.contact?.phone || '',
          wechat: editForm.wechat
        },
        avatar: editForm.avatar, // ✅ 必须加上这行！
        updateTime: db.serverDate()
      },
      success: () => {
        console.log('云数据库信息更新成功');
        wx.showToast({ title: "保存成功！", icon: "success" });
        const pages = getCurrentPages();
        const profilePage = pages.find(page => page.route === 'pages/profile/profile');
        if (profilePage) {
          // 如果 profile 页面在栈中，直接调用它的 onShow 方法刷新
          profilePage.onShow();
        }
      },
      fail: (err) => {
        console.error('云数据库同步失败:', err);
        wx.showToast({ title: '保存失败，请重试', icon: 'none' });
      }
    });

    // 5. 提示并返回
    setTimeout(() => {
      wx.navigateBack({
        delta: 1
      });
    }, 1500);
  }
});