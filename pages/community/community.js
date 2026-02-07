// pages/community/community.js
const app = getApp(); // 获取全局实例
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
    filteredTeamUpPosts: [] // 显示的帖子列表
  },

  onLoad() {
    this.loadTeamUpPosts(); // 加载初始数据
  },

  onShow() {
    this.loadTeamUpPosts(); // 每次进入页面都重新加载数据
  },

  // 从云数据库加载帖子数据
  async loadTeamUpPosts() {
    try {
      const res = await wx.cloud.database().collection('teamUpPosts')
        .where({ isActive: true }) // 只查询活跃帖子
        .get();

      const cloudPosts = res.data || [];
      const localPosts = fakeData.teamUpPosts; // 保留本地假数据作为补充


     // 合并云端和本地数据（去重）
     const allPosts = [...cloudPosts, ...localPosts];
     const uniquePosts = Array.from(
       new Map(allPosts.map(post => [post._id || post.id, post])).values()
     );

     this.setData({ filteredTeamUpPosts: uniquePosts });
   } catch (err) {
     console.error("加载帖子失败：", err);
     wx.showToast({ title: "加载失败，请重试", icon: "none" });
   }
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
    let filtered = [...this.data.filteredTeamUpPosts]; // 基于当前显示的数据进行筛选

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