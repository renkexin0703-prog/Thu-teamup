const fakeData = require("../../utils/fake-data.js");

Page({
  data: {
    filterOptions: fakeData.filterOptions,
    currentFilter: {
      gender: "不限",
      departments: [],
      grade: "",
      skills: []
    },
    filteredActivities: []
  },

  onLoad() {
    // 初始化显示所有已审核活动
    this.setData({
      filteredActivities: fakeData.approvedActivities
    });
  },

  // 性别筛选
  onGenderChange(e) {
    const gender = fakeData.filterOptions.gender[e.detail.value];
    const currentFilter = { ...this.data.currentFilter, gender };
    this.setData({ currentFilter });
    this.applyFilters();
  },

  // 院系筛选
  onDeptChange(e) {
    const deptIndexes = e.detail.value;
    const departments = deptIndexes.map(idx => fakeData.filterOptions.departments[idx]);
    const currentFilter = { ...this.data.currentFilter, departments };
    this.setData({ currentFilter });
    this.applyFilters();
  },

  // 年级筛选
  onGradeChange(e) {
    const grade = fakeData.filterOptions.grades[e.detail.value];
    const currentFilter = { ...this.data.currentFilter, grade };
    this.setData({ currentFilter });
    this.applyFilters();
  },

  // 技能筛选
  onSkillChange(e) {
    const skillIndexes = e.detail.value;
    const skills = skillIndexes.map(idx => fakeData.filterOptions.skills[idx]);
    const currentFilter = { ...this.data.currentFilter, skills };
    this.setData({ currentFilter });
    this.applyFilters();
  },

  // 应用筛选条件
  applyFilters() {
    const { currentFilter } = this.data;
    let filtered = [...fakeData.approvedActivities];

    // 性别筛选（活动本身无性别，此处仅演示逻辑）
    if (currentFilter.gender !== "不限") {
      filtered = filtered.filter(act => act.grade.includes("不限") || act.grade.includes(currentFilter.gender));
    }

    // 院系筛选
    if (currentFilter.departments.length > 0) {
      filtered = filtered.filter(act => currentFilter.departments.includes(act.department));
    }

    // 年级筛选
    if (currentFilter.grade) {
      filtered = filtered.filter(act => act.grade.includes(currentFilter.grade) || act.grade === "不限");
    }

    // 技能筛选
    if (currentFilter.skills.length > 0) {
      filtered = filtered.filter(act => currentFilter.skills.some(skill => act.skills.includes(skill)));
    }

    this.setData({ filteredActivities: filtered });
  },

  gotoTeamUp() {
    console.log("点击了一键组队按钮");
    wx.navigateTo({
      url: '/pages/publish-teamup/publish-teamup',
      success: () => {
        console.log("成功跳转到发起组队页面");
      },
      fail: (err) => {
        console.error("跳转失败:", err);
        wx.showToast({
          title: "跳转失败，请重试",
          icon: "none"
        });
      }
    });
  },

  // 【一键组队】按钮点击事件
  onQuickTeamUp() {
    console.log("点击了一键组队按钮");

    // 打印跳转路径
    console.log("尝试跳转到:", '/pages/publish-teamup/publish-teamup');

    // 检查页面栈长度
    const pageStackLength = getCurrentPages().length;
    console.log("当前页面栈长度:", pageStackLength);

    // 如果页面栈过深，使用 redirectTo
    const navigateMethod = pageStackLength >= 9 ? wx.redirectTo : wx.navigateTo;

    navigateMethod({
      url: '/pages/publish-teamup/publish-teamup',
      success: () => {
        console.log("成功跳转到发起组队页面");
      },
      fail: (err) => {
        console.error("跳转失败:", err);
        wx.showToast({
          title: "跳转失败，请重试",
          icon: "none"
        });
      }
    });
  }
});