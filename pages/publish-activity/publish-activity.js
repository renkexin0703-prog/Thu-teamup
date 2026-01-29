const fakeData = require("../../utils/fake-data.js");

Page({
  data: {
    filterOptions: fakeData.filterOptions,
    title: "",
    organizer: "",
    selectedDept: "",
    selectedGrade: "",
    selectedDate: "",
    selectedSkills: [],
    desc: ""
  },

  // 输入标题
  onTitleInput(e) {
    this.setData({ title: e.detail.value });
  },

  // 输入主办方
  onOrganizerInput(e) {
    this.setData({ organizer: e.detail.value });
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

  // 选择日期
  onDateSelect(e) {
    this.setData({ selectedDate: e.detail.value });
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

  // 提交活动【假数据存储】
  submitActivity() {
    const { title, organizer, selectedDept, selectedGrade, selectedDate, selectedSkills, desc } = this.data;
    
    // 简单校验
    if (!title || !organizer || !selectedDept || !selectedDate) {
      wx.showToast({
        title: "请填写必填项",
        icon: "none"
      });
      return;
    }

    // 模拟提交：添加到我的待审核活动列表
    wx.showToast({
      title: "提交成功！待审核",
      icon: "success"
    });

    // 返回个人中心
    setTimeout(() => {
      wx.navigateBack({
        delta: 1
      });
    }, 1500);
  }
});