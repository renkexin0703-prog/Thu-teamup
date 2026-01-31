const fakeData = require("../../utils/fake-data.js");

Page({
  data: {
    applicants: [],
    selectedApplicants: []
  },

  onLoad(options) {
    const postId = options.postId;
    const applicants = fakeData.contactRequests.filter(req => req.teamUpPostId === postId);
    this.setData({ applicants });
  },

  onApplicantSelect(e) {
    const selectedIndex = e.detail.value;
    const selectedApplicants = selectedIndex.map(index => this.data.applicants[index]);
    this.setData({ selectedApplicants });
  },

  onTeamUpSuccess() {
    const { selectedApplicants } = this.data;

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
    const teamUpPosts = fakeData.teamUpPosts.map(post => {
      if (post.id === this.options.postId) {
        return { ...post, isActive: false };
      }
      return post;
    });

    fakeData.teamUpPosts = teamUpPosts;

    wx.showToast({ title: "组队成功！", icon: "success" });
    wx.navigateBack();
  }
});