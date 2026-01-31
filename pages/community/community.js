// pages/community/community.js
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
    filteredTeamUpPosts: []
  },

  onLoad() {
    this.setData({
      filteredTeamUpPosts: fakeData.teamUpPosts.filter(post => post.isActive)
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
    let filtered = [...fakeData.teamUpPosts].filter(post => post.isActive);

    if (currentFilter.gender !== "不限") {
      filtered = filtered.filter(post => post.gender === currentFilter.gender);
    }

    if (currentFilter.departments.length > 0) {
      filtered = filtered.filter(post => currentFilter.departments.includes(post.userDepartment));
    }

    if (currentFilter.grade) {
      filtered = filtered.filter(post => post.userGrade === currentFilter.grade);
    }

    if (currentFilter.skills.length > 0) {
      filtered = filtered.filter(post => currentFilter.skills.some(skill => post.skills.includes(skill)));
    }

    this.setData({ filteredTeamUpPosts: filtered });
  },

  // 联系TA - 跳转到联系TA页面
  onContactTA(e) {
    const wechat = e.currentTarget.dataset.wechat;
    wx.navigateTo({
      url: `/pages/contact-ta/contact-ta?wechat=${wechat}`
    });
  },

  // 了解TA - 跳转到了解TA页面
  onKnowTA(e) {
    const userId = e.currentTarget.dataset.userId;
    wx.navigateTo({
      url: `/pages/know-ta/know-ta?userId=${userId}`
    });
  },

  // 选择队友 - 跳转到选择队友页面
  onSelectMember(e) {
    const postId = e.currentTarget.dataset.postId;
    wx.navigateTo({
      url: `/pages/select-teammates/select-teammates?postId=${postId}`
    });
  },

  // 发起组队
  gotoPublishTeamUp() {
    wx.navigateTo({
      url: "/pages/publish-teamup/publish-teamup"
    });
  }
});