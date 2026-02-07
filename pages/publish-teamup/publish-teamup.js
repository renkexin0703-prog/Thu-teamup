// pages/publish-teamup/publish-teamup.js
const app = getApp(); 
const fakeData = require("../../utils/fake-data.js");

Page({
  data: {
    filterOptions: fakeData.filterOptions,
    title: "",
    selectedGender: "",
    desc: "",
    wechat: "",
    selectedSkills: []
  },

  onLoad(options) {
    const globalUser = app.globalData.userInfo || {};
    if (!globalUser.id) {
      wx.showToast({ title: "请先完成微信登录", icon: "none" });
      wx.redirectTo({ url: "/pages/login/login" });
      return;
    }

    if (options.title) {
      this.setData({ title: decodeURIComponent(options.title) });
    }
    if (options.skills) {
      const skills = decodeURIComponent(options.skills).split(",");
      this.setData({ selectedSkills: skills });
    }

    // 预填技能
    const userSkills = globalUser.skills || [];
    if (userSkills.length > 0) {
      this.setData({ selectedSkills: userSkills });
    }
  },

  onTitleInput(e) {
    this.setData({ title: e.detail.value });
  },

  onGenderSelect(e) {
    const gender = fakeData.filterOptions.gender[e.detail.value];
    this.setData({ selectedGender: gender });
  },

  onDescInput(e) {
    this.setData({ desc: e.detail.value });
  },

  onWechatInput(e) {
    this.setData({ wechat: e.detail.value });
  },

  async submitTeamUp() {
    const { title, selectedGender, desc, wechat, selectedSkills } = this.data;
    const db = wx.cloud.database();
    const globalUser = app.globalData.userInfo || {};
    const editForm = wx.getStorageSync('userInfo') || {}; // 读取【我的】页本地信息

    // 1. 必填项校验
    const requiredFields = [
      { name: "标题", value: title },
      { name: "性别", value: selectedGender },
      { name: "微信号", value: wechat }
    ];
    const emptyField = requiredFields.find(item => !item.value);
    if (emptyField) {
      wx.showToast({ title: `请填写${emptyField.name}`, icon: "none" });
      return;
    }

    // 2. 从云数据库读取最新信息
    let userDbInfo = {};
    try {
      const res = await db.collection('users').doc(globalUser.id).get();
      userDbInfo = res.data;
    } catch (err) {
      console.error("读取用户信息失败:", err);
    }

    // 3. 构造帖子（优先用自定义信息，兜底“微信用户”）
    const newPost = {
      _id: `team_${Date.now()}`,
      id: `team_${Date.now()}`,
      userId: globalUser.id,
      userName: editForm.name || userDbInfo.name || globalUser.name || "未知用户",
      userAvatar: globalUser.avatar || "",
      userDepartment: userDbInfo.dept || editForm.dept || "未填写",
      userGrade: userDbInfo.grade || editForm.grade || "未填写",
      gender: selectedGender,
      title: title,
      content: desc || "无描述",
      skills: selectedSkills.length > 0 ? selectedSkills : (editForm.skill ? editForm.skill.split(',') : []),
      contactWechat: wechat,
      viewCount: 0,
      isActive: true,
      createTime: db.serverDate(),
      applicants: []
    };

    try {
      await db.collection('teamUpPosts').add({ data: newPost });
      wx.showToast({ title: "发布成功！", icon: "success" });
      setTimeout(() => {
        wx.navigateBack({ delta: 1 });
      }, 1500);
    } catch (err) {
      console.error("发布失败：", err);
      wx.showToast({ title: "发布失败，请重试", icon: "none" });
    }
  }
});