// pages/select-teammates/select-teammates.js
const fakeData = require("../../utils/fake-data.js");

Page({
  data: {
    applicants: [],
    selectedApplicants: []
  },

  onLoad(options) {
    const postId = options.postId;
    this.loadApplicants(postId);
  },

  // 从云数据库加载联系过该帖子的用户
  async loadApplicants(postId) {
    try {
      // 查询联系记录
      const res = await wx.cloud.database().collection('contactRecords').where({
        postId
      }).get();

      // 获取联系用户信息
      const applicants = res.data.map(record => {
        const user = fakeData.userInfo; // 假设用户信息已同步到本地
        return {
          userId: record.contactedBy,
          userName: user.name,
          userAvatar: user.avatar,
          userDepartment: user.department,
          userGrade: user.grade,
          skills: user.skills
        };
      });

      this.setData({ applicants });
    } catch (err) {
      console.error("加载申请人失败：", err);
      wx.showToast({ title: "加载失败，请重试", icon: "none" });
    }
  },

  // 选择申请人
  onApplicantSelect(e) {
    const selectedIndex = e.detail.value;
    const selectedApplicants = selectedIndex.map(index => this.data.applicants[index]);
    this.setData({ selectedApplicants });
  },

  // 组队成功
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