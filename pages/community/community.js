const app = getApp();
const fakeData = require("../../utils/fake-data.js");

Page({
  data: {
    filterOptions: {
      gender: ["不限", "男", "女"],
      // 修改点 1：去除了研一研二，添加了不限
      grades: ["不限", "大一", "大二", "大三", "大四"]
    },
    currentFilter: {
      gender: "不限",
      departments: [],
      grade: "不限",
      skills: []
    },
    allTeamUpPosts: [],
    filteredTeamUpPosts: [],
    currentUserId: ''
  },

  onLoad() {
    const userInfo = app.globalData.userInfo || wx.getStorageSync('userInfo');
    if (userInfo && userInfo.id) {
      this.setData({ currentUserId: userInfo.id });
    }
    this.loadTeamUpPosts();
  },

  onShow() {
    this.loadTeamUpPosts();
  },

  async loadTeamUpPosts() {
    wx.showLoading({ title: '加载中...' });
    try {
      const res = await wx.cloud.database().collection('teamUpPosts')
        .where({ isActive: true })
        .orderBy('createTime', 'desc')
        .get();

      const cloudPosts = res.data || [];
      const localPosts = fakeData.teamUpPosts || [];

      const allPosts = [...cloudPosts, ...localPosts];
      const uniquePosts = Array.from(
        new Map(allPosts.map(post => [post._id || post.id, post])).values()
      );

      const updatedPosts = uniquePosts.map(post => ({
        ...post,
        isOwnPost: post.userId === this.data.currentUserId
      }));

      this.setData({ allTeamUpPosts: updatedPosts }, () => {
        this.applyFilters();
        wx.hideLoading();
      });
    } catch (err) {
      console.error("加载失败", err);
      wx.hideLoading();
    }
  },

  onGenderChange(e) {
    const gender = this.data.filterOptions.gender[e.currentTarget.dataset.index];
    this.setData({ 'currentFilter.gender': gender }, () => this.applyFilters());
  },

  onGradeChange(e) {
    const grade = this.data.filterOptions.grades[e.currentTarget.dataset.index];
    this.setData({ 'currentFilter.grade': grade }, () => this.applyFilters());
  },

  applyFilters() {
    const { currentFilter, allTeamUpPosts } = this.data;
    let filtered = allTeamUpPosts.filter(post => {
      const genderMatch = currentFilter.gender === "不限" || post.gender === currentFilter.gender;
      const gradeMatch = currentFilter.grade === "不限" || 
                         (post.targetGrades && (post.targetGrades.includes(currentFilter.grade) || post.targetGrades.includes("不限")));
      return genderMatch && gradeMatch;
    });
    this.setData({ filteredTeamUpPosts: filtered });
  },

  resetFilters() {
    this.setData({
      currentFilter: { gender: "不限", departments: [], grade: "不限", skills: [] }
    }, () => this.applyFilters());
  },

  async onContactTA(e) {
    const postId = e.currentTarget.dataset.id; // 这里用postId更准确
  
    try {
      // 1. 从云端数据库查询这条帖子的完整信息
      const db = wx.cloud.database();
      const postRes = await db.collection('teamUpPosts').doc(postId).get();
      const postData = postRes.data;
  
      if (!postData) {
        wx.showToast({ title: "未找到该帖子信息", icon: "none" });
        return;
      }
  
      // 2. 取出微信号（如果没有，给个默认值）
      const wechat = postData.contactWechat || "未填写微信号";
  
      // 3. 跳转到contact-ta页面，同时传postId和wechat
      wx.navigateTo({
        url: `/pages/contact-ta/contact-ta?postId=${postId}&wechat=${encodeURIComponent(wechat)}`
      });
    } catch (err) {
      console.error("获取帖子信息失败：", err);
      wx.showToast({ title: "获取信息失败，请重试", icon: "none" });
    }
  },

  onKnowTA(e) {
    const userId = e.currentTarget.dataset.userId;
    wx.navigateTo({ url: `/pages/know-ta/know-ta?userId=${userId}` });
  },

  onSelectMember(e) {
    const postId = e.currentTarget.dataset.postId;
    wx.navigateTo({ url: `/pages/select-teammates/select-teammates?postId=${postId}` });
  },

  gotoPublishTeamUp() {
    wx.navigateTo({ url: "/pages/publish-teamup/publish-teamup" });
  }
});