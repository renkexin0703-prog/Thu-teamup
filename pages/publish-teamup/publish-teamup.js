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
    selectedSkills: [] // 保留原有技能字段，不新增其他选择器
  },

  onLoad(options) {
    // 1. 校验用户是否登录（未登录跳转登录页）
    const globalUser = app.globalData.userInfo;
    if (!globalUser || !globalUser.id) {
      wx.showToast({ title: "请先完成微信登录", icon: "none" });
      wx.redirectTo({ url: "/pages/login/login" });
      return;
    }

    // 2. 处理页面跳转传参（保留原有逻辑）
    if (options.title) {
      this.setData({ title: decodeURIComponent(options.title) });
    }
    if (options.skills) {
      const skills = decodeURIComponent(options.skills).split(",");
      this.setData({ selectedSkills: skills });
    }
  },

  // 保留原有输入/选择方法
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
    const { title, selectedGender, desc, wechat, selectedSkills } = this.data;
    const db = wx.cloud.database(); // 数据库引用

    // 1. 精简版必填项校验（只校验原有核心字段）
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

    // 2. 获取登录后的真实用户信息（替换fakeData）
    const globalUser = app.globalData.userInfo;
    if (!globalUser.id) {
      wx.showToast({ title: "登录状态失效，请重新登录", icon: "none" });
      wx.redirectTo({ url: "/pages/login/login" });
      return;
    }

    // 3. 构造新帖子（仅保留原有字段，用真实用户ID）
    const newPost = {
      _id: `team_${Date.now()}`, // 恢复你原有ID生成方式
      userId: globalUser.id, // 关键：登录用户的openid，联动community的isOwnPost
      userName: globalUser.name || "未知用户", // 真实昵称
      userAvatar: globalUser.avatar || "", // 真实头像
      // 保留fakeData里的院系/年级（你原有逻辑），不新增选择器
      userDepartment: fakeData.userInfo.department,
      userGrade: fakeData.userInfo.grade,
      gender: selectedGender,
      title: title,
      content: desc || "无描述",
      skills: selectedSkills.length > 0 ? selectedSkills : fakeData.userInfo.skills,
      contactWechat: wechat,
      viewCount: 0,
      isActive: true,
      createTime: db.serverDate() // 云服务器时间，更准确
    };

    try {
      // 4. 上传到云数据库teamUpPosts集合
      await db.collection('teamUpPosts').add({
        data: newPost
      });

      wx.showToast({ title: "发布成功！", icon: "success" });

      // 5. 返回社区页
      setTimeout(() => {
        wx.navigateBack({ delta: 1 });
      }, 1500);
    } catch (err) {
      console.error("发布失败：", err);
      wx.showToast({ title: "发布失败，请重试", icon: "none" });
    }
  }
});