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
    wechat: ""
  },

  onLoad() {
    // 获取当前用户信息
    const userInfo = fakeData.userInfo;
    this.setData({
      userInfo,
      name: userInfo.name,
      gender: userInfo.gender,
      grade: userInfo.grade,
      department: userInfo.department,
      skills: userInfo.skills,
      wechat: userInfo.wechat
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
  onSkillSelect(e) {
    const skillIndexes = e.detail.value;
    const skills = skillIndexes.map(idx => this.data.filterOptions.skills[idx]);
    this.setData({ skills });
  },

  // 输入微信号
  onWechatInput(e) {
    this.setData({ wechat: e.detail.value });
  },

  // 提交修改
  onSubmit() {
    const { name, gender, grade, department, skills, wechat } = this.data;

    // 简单校验
    if (!name || !gender || !grade || !department || !wechat) {
      wx.showToast({
        title: "请填写必填项",
        icon: "none"
      });
      return;
    }

    // 更新用户信息（模拟接口调用）
    const userInfo = fakeData.userInfo;
    userInfo.name = name;
    userInfo.gender = gender;
    userInfo.grade = grade;
    userInfo.department = department;
    userInfo.skills = skills;
    userInfo.wechat = wechat;

    wx.showToast({
      title: "保存成功！",
      icon: "success"
    });

     // 返回上一页，并强制刷新 profile 页面
  setTimeout(() => {
    wx.navigateBack({
      delta: 1
    });
  }, 1500);

  }
});