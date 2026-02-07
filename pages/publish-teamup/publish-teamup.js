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
    if (options.title) {
      this.setData({ title: decodeURIComponent(options.title) });
    }

    if (options.skills) {
      const skills = decodeURIComponent(options.skills).split(",");
      this.setData({ selectedSkills: skills });
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

  // 发布组队【上传到云数据库】
  async submitTeamUp() {
    const { title, selectedGender, desc, wechat } = this.data;

    // 简单校验
    if (!title || !selectedGender || !wechat) {
      wx.showToast({ title: "请填写必填项", icon: "none" });
      return;
    }

    // 获取当前用户最新信息
    const userInfo = fakeData.userInfo;

    // 构造新帖子
    const newPost = {
      _id: `team_${Date.now()}`, // 生成唯一ID
      userId: userInfo.id,
      userName: userInfo.name,
      userAvatar: userInfo.avatar,
      userDepartment: userInfo.department,
      userGrade: userInfo.grade,
      gender: selectedGender,
      title: title,
      content: desc,
      skills: userInfo.skills,
      contactWechat: wechat,
      viewCount: 0,
      isActive: true,
      createTime: new Date().toISOString() // 添加创建时间
    };

    try {
      // 上传到云数据库
      await wx.cloud.database().collection('teamUpPosts').add({
        data: newPost
      });

      wx.showToast({ title: "发布成功！", icon: "success" });

      // 返回社区页
      setTimeout(() => {
        wx.navigateBack({ delta: 1 });
      }, 1500);
    } catch (err) {
      console.error("发布失败：", err);
      wx.showToast({ title: "发布失败，请重试", icon: "none" });
    }
  }
});