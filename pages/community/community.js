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
    // 初始化显示所有活跃组队帖子
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

    // 性别筛选
    if (currentFilter.gender !== "不限") {
      filtered = filtered.filter(post => post.gender === currentFilter.gender);
    }

    // 院系筛选
    if (currentFilter.departments.length > 0) {
      filtered = filtered.filter(post => currentFilter.departments.includes(post.userDepartment));
    }

    // 年级筛选
    if (currentFilter.grade) {
      filtered = filtered.filter(post => post.userGrade === currentFilter.grade);
    }

    // 技能筛选
    if (currentFilter.skills.length > 0) {
      filtered = filtered.filter(post => currentFilter.skills.some(skill => post.skills.includes(skill)));
    }

    this.setData({ filteredTeamUpPosts: filtered });
  },

  // 联系TA - 弹出微信号+复制按钮
  onContactTap(e) {
    const wechat = e.currentTarget.dataset.wechat;
    wx.showModal({
      title: "联系对方",
      content: `微信号：${wechat}`,
      confirmText: "复制微信号",
      cancelText: "取消",
      success: (res) => {
        if (res.confirm) {
          // 复制微信号到剪贴板
          wx.setClipboardData({
            data: wechat,
            success: () => {
              wx.showToast({
                title: "微信号已复制",
                icon: "success"
              });
            }
          });
        }
      }
    });
  },

  // 选择最终队友 - 下架帖子
  onSelectMember(e) {
    const postId = e.currentTarget.dataset.postId;
    // 更新帖子状态为非活跃（下架）
    const updatedPosts = this.data.filteredTeamUpPosts.map(post => {
      if (post.id === postId) {
        return { ...post, isActive: false };
      }
      return post;
    });
    this.setData({ filteredTeamUpPosts: updatedPosts });
    wx.showToast({
      title: "已选择队友，帖子已下架",
      icon: "success"
    });
  },

  // 跳转到发布组队页
  gotoPublishTeamUp() {
    wx.navigateTo({
      url: "/pages/publish-teamup/publish-teamup"
    });
  }
});