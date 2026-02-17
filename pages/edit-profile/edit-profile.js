// pages/edit-profile/edit-profile.js
const fakeData = require("../../utils/fake-data.js");

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
  const cloudPath = `avatars/${Date.now()}_${Math.random().toString(36).substr(2, 9)}.jpg`;
  const db = wx.cloud.database();

  wx.cloud.uploadFile({
    cloudPath,
    filePath,
    success: (res) => {
      const fileID = res.fileID;

      // 更新本地数据
      const editForm = {
        ...this.data.userInfo,
        avatar: fileID
      };

      // 1. 保存到本地缓存
      wx.setStorageSync('userInfo', editForm);

      // 2. 同步到全局变量
      const app = getApp();
      app.globalData.userInfo = {
        ...app.globalData.userInfo,
        ...editForm
      };

      // 3. 更新当前页面的 avatarUrl（用于预览）
      this.setData({ avatarUrl: fileID });

      // 4. 更新云数据库
      const currentUser = app.globalData.userInfo._openid || app.globalData.userInfo._id;
      if (!openid) {
        console.error("用户 openid 不存在，无法更新数据库");
        return;
      }

      db.collection('users').doc(currentUser.id).update({
        data: {
          avatar: fileID,
          updateTime: db.serverDate()
        },
        success: () => {
          wx.showToast({ title: "头像上传成功", icon: "success" });
        },
        fail: (err) => {
          console.error("上传失败:", err);
          wx.showToast({ title: "上传失败，请重试", icon: "none" });
        }
      });
    },
    fail: (err) => {
      console.error("上传失败:", err);
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
    this.setData({ department });
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

  // pages/edit-profile/edit-profile.js
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

  // 4. ✅ 更新云数据库：必须包含 avatar 字段
  const db = wx.cloud.database();
  const currentUser = app.globalData.userInfo;

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
      console.log('云数据库信息更新成功');
      wx.showToast({ title: "保存成功！", icon: "success" });
      const pages = getCurrentPages();
const minePage = pages.find(page => page.route === 'pages/mine/mine');
if (minePage) {
  // 如果 mine 页面在栈中，直接调用它的 onShow 方法刷新
  minePage.onShow();
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