// pages/publish-teamup/publish-teamup.js
const app = getApp(); // 获取全局实例
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
    // 接收传入的参数
    if (options.title) {
      this.setData({ title: decodeURIComponent(options.title) });
    }

    if (options.skills) {
      const skills = decodeURIComponent(options.skills).split(",");
      this.setData({ selectedSkills: skills });
    }
  },


  // 输入标题
  onTitleInput(e) {
    this.setData({ title: e.detail.value });
  },

  // 选择性别要求
  onGenderSelect(e) {
    const gender = fakeData.filterOptions.gender[e.detail.value];
    this.setData({ selectedGender: gender });
  },

  // 输入描述
  onDescInput(e) {
    this.setData({ desc: e.detail.value });
  },

  // 输入微信号
  onWechatInput(e) {
    this.setData({ wechat: e.detail.value });
  },

  // 发布组队【假数据存储】
  submitTeamUp() {
    const { title, selectedGender, desc, wechat } = this.data;

    // 简单校验
    if (!title || !selectedGender || !wechat) {
      wx.showToast({
        title: "请填写必填项",
        icon: "none"
      });
      return;
    }

    // 获取当前用户最新信息（来自【我的】页面）
    const userInfo = fakeData.userInfo;

    // 构造新帖子
    const newPost = {
      id: `team_${Date.now()}`, // 生成唯一ID
      userId: userInfo.id,
      userName: userInfo.name,
      userAvatar: userInfo.avatar,
      userDepartment: userInfo.department,
      userGrade: userInfo.grade,
      gender: selectedGender,
      title: title,
      content: desc,
      skills: userInfo.skills, // 使用【我的】页面中的技能标签
      contactWechat: wechat,
      viewCount: 0,
      isActive: true // 活跃状态
    };

    // 写入全局变量（关键步骤）
    if (app.globalData && app.globalData.teamUpPosts) {
      app.globalData.teamUpPosts.push(newPost);
      console.log("已成功添加新帖子:", newPost);
    } else {
      console.error("全局变量未定义！无法写入数据。");
      wx.showToast({
        title: "发布失败，请重试",
        icon: "none"
      });
      return;
    }

    // 提示成功
    wx.showToast({
      title: "发布成功！",
      icon: "success"
    });

    // 返回社区页
    setTimeout(() => {
      wx.navigateBack({
        delta: 1
      });
    }, 1500);
  }
});