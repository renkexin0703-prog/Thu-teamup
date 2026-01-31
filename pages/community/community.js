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
    filteredTeamUpPosts: [],
    selectedApplicants: [] // 记录选中的申请人
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

  // 选择最终队友 - 弹出申请人列表
  onSelectMember(e) {
    const postId = e.currentTarget.dataset.postId;
    const applicants = fakeData.contactRequests.filter(req => req.teamUpPostId === postId);
    this.setData({ selectedApplicants: [], applicants, showApplicantPanel: true });
  },

  // 多选申请人
  onApplicantSelect(e) {
    const selectedIndex = e.detail.value;
    const selectedApplicants = selectedIndex.map(index => this.data.applicants[index]);
    this.setData({ selectedApplicants });
  },

  // 组队成功
  onTeamUpSuccess() {
    const { selectedApplicants, filteredTeamUpPosts } = this.data;

    if (selectedApplicants.length === 0) {
      wx.showToast({ title: "请至少选择一位队友", icon: "none" });
      return;
    }

    // 更新我的合作者
    const userInfo = fakeData.userInfo;
    userInfo.partners = [
      ...userInfo.partners,
      ...selectedApplicants.map(applicant => ({
        id: applicant.userId,
        name: applicant.userName,
        avatar: applicant.userAvatar,
        department: applicant.userDepartment,
        grade: applicant.userGrade,
        skills: applicant.skills,
        tags: ["新队友"],
        activePost: ""
      }))
    ];

    // 删除帖子
    const updatedPosts = filteredTeamUpPosts.map(post => {
      if (post.id === this.data.applicants[0].teamUpPostId) {
        return { ...post, isActive: false };
      }
      return post;
    });

    this.setData({ filteredTeamUpPosts: updatedPosts, showApplicantPanel: false });
    wx.showToast({ title: "组队成功！", icon: "success" });
  },

  // 关闭申请人面板
  closeApplicantPanel() {
    this.setData({ showApplicantPanel: false });
  },

  // 跳转到发布组队页
  gotoPublishTeamUp() {
    wx.navigateTo({
      url: "/pages/publish-teamup/publish-teamup"
    });
  }
});