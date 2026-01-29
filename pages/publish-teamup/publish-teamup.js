const fakeData = require("../../utils/fake-data.js");

Page({
  data: {
    filterOptions: fakeData.filterOptions,
    title: "",
    selectedGender: "",
    selectedDept: "",
    selectedGrade: "",
    selectedSkills: [],
    desc: "",
    wechat: ""
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

  // 选择院系
  onDeptSelect(e) {
    const dept = fakeData.filterOptions.departments[e.detail.value];
    this.setData({ selectedDept: dept });
  },

  // 选择年级
  onGradeSelect(e) {
    const grade = fakeData.filterOptions.grades[e.detail.value];
    this.setData({ selectedGrade: grade });
  },

  // 选择技能
  onSkillSelect(e) {
    const skillIndexes = e.detail.value;
    const skills = skillIndexes.map(idx => fakeData.filterOptions.skills[idx]);
    this.setData({ selectedSkills: skills });
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
    const { title, selectedGender, selectedDept, selectedGrade, selectedSkills, desc, wechat } = this.data;
    
    // 简单校验
    if (!title || !selectedGender || !wechat) {
      wx.showToast({
        title: "请填写必填项",
        icon: "none"
      });
      return;
    }

    // 模拟发布
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