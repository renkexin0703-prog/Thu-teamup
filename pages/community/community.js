const app = getApp(); 
const fakeData = require("../../utils/fake-data.js");

Page({
  data: {
    // 保留队友改的筛选选项（UI层面）
    filterOptions: {
      gender: ["不限", "男", "女"],
      grades: ["不限", "大一", "大二", "大三", "大四"]
    },
    // 恢复你的核心筛选逻辑
    currentFilter: {
      gender: "不限",
      departments: [],
      grade: "",
      skills: []
    },
    allTeamUpPosts: [], // 队友新增的：存储全量数据
    filteredTeamUpPosts: [], // 你的核心：显示的帖子列表
    currentUserId: '' // 当前登录用户 ID
  },

  // 恢复你的登录逻辑（核心，保证用户ID正确）
  onLoad() {
    const globalUser = app.globalData.userInfo;
    let currentUserId = '';
    
    if (globalUser && globalUser.id) {
      currentUserId = globalUser.id;
      wx.setStorageSync('userInfo', globalUser);
    } else {
      wx.showToast({ title: '请先登录', icon: 'none' });
      wx.redirectTo({ url: '/pages/login/login' });
    }
  
    this.setData({ currentUserId });
    this.loadTeamUpPosts();
  },

  // 保留队友的 onShow 刷新逻辑
  onShow() {
    this.loadTeamUpPosts();
  },

  // 融合版 loadTeamUpPosts：保留队友的假数据+去重，恢复你的核心查询逻辑
  async loadTeamUpPosts() {
    wx.showLoading({ title: '加载中...' }); // 保留队友的加载提示
    try {
      // 你的核心：查询云端活跃帖子
      const res = await wx.cloud.database().collection('teamUpPosts')
        .where({ isActive: true })
        .orderBy('createTime', 'desc')
        .get();

      const cloudPosts = res.data || [];
      const localPosts = fakeData.teamUpPosts || [];

      // 保留队友的去重逻辑
      const allPosts = [...cloudPosts, ...localPosts];
      const uniquePosts = Array.from(
        new Map(allPosts.map(post => [post._id || post.id, post])).values()
      );

      // 恢复你的 isOwnPost 逻辑（核心，判断是否是自己的帖子）
      const updatedPosts = uniquePosts.map(post => ({
        ...post,
        isOwnPost: post.userId === this.data.currentUserId
      }));

      // 融合：同时存储全量数据和筛选后数据
      this.setData({ 
        allTeamUpPosts: updatedPosts,
        filteredTeamUpPosts: updatedPosts // 初始显示全量数据
      }, () => {
        this.applyFilters(); // 保留队友的筛选应用
        wx.hideLoading();
      });
    } catch (err) {
      console.error("加载失败", err);
      wx.hideLoading();
    }
  },

  // 保留队友的性别筛选（适配新的filterOptions）
  onGenderChange(e) {
    const gender = this.data.filterOptions.gender[e.currentTarget.dataset.index];
    this.setData({ 'currentFilter.gender': gender }, () => this.applyFilters());
  },

  // 保留队友的年级筛选（适配新的filterOptions）
  onGradeChange(e) {
    const grade = this.data.filterOptions.grades[e.currentTarget.dataset.index];
    this.setData({ 'currentFilter.grade': grade }, () => this.applyFilters());
  },

  // 恢复你的核心筛选逻辑（关键，保证筛选正确）
  applyFilters() {
    const { currentFilter, allTeamUpPosts } = this.data; // 改用全量数据筛选
    let filtered = [...allTeamUpPosts];

    // 你的核心筛选条件
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

    // 保留队友的年级匹配逻辑（兼容新UI）
    if (currentFilter.grade !== "不限" && currentFilter.grade !== "") {
      filtered = filtered.filter(post => 
        post.targetGrades && (post.targetGrades.includes(currentFilter.grade) || post.targetGrades.includes("不限"))
      );
    }

    this.setData({ filteredTeamUpPosts: filtered });
  },

  // 恢复你的核心：点击【联系TA】+ 记录联系行为（最关键的逻辑）
  onContactTA(e) {
    const postId = e.currentTarget.dataset.id || e.currentTarget.dataset.postId; // 兼容队友的data-id
    const wechat = e.currentTarget.dataset.wechat;
    const userId = e.currentTarget.dataset.userId;

    // 保留队友的跳转逻辑（传参兼容）
    wx.navigateTo({
      url: `/pages/contact-ta/contact-ta?postId=${postId}&wechat=${encodeURIComponent(wechat || "")}`
    });

    // 恢复你的核心：记录联系行为
    this.recordContact(postId, userId);
  },

  // 完全恢复你的 recordContact 逻辑（核心中的核心，保证contactRecords有数据）
  async recordContact(postId, postAuthorId) {
    const currentUserId = this.data.currentUserId;
    const db = wx.cloud.database();

    try {
      // 1. 查询当前联系人的信息
      const userRes = await db.collection('users').doc(currentUserId).get();
      const contactUser = userRes.data;

      // 2. 检查是否已记录
      const res = await db.collection('contactRecords').where({
        postId,
        contactedBy: currentUserId
      }).get();

      if (res.data.length === 0) {
        // 3. 新增联系记录（包含用户信息）
        await db.collection('contactRecords').add({
          data: {
            postId,
            contactedBy: currentUserId,
            targetUserId: postAuthorId,
            contactTime: db.serverDate(),
            userName: contactUser.name || "未知用户",
            userAvatar: contactUser.avatar || "",
            userDepartment: contactUser.department || "",
            userGrade: contactUser.grade || "",
            skills: contactUser.skills || [],
            contactWechat: contactUser.wechat || ""
          }
        });

        // 4. 同时更新 teamUpPosts.applicants
        await db.collection('teamUpPosts').doc(postId).update({
          data: {
            applicants: db.command.addToSet({
              userId: currentUserId,
              userName: contactUser.name || "未知用户",
              userAvatar: contactUser.avatar || "",
              userDepartment: contactUser.department || "",
              userGrade: contactUser.grade || "",
              skills: contactUser.skills || [],
              contactWechat: contactUser.wechat || ""
            })
          }
        });
      }
    } catch (err) {
      console.error("记录联系行为失败：", err);
    }
  },

  // 保留【了解TA】逻辑（无改动）
  onKnowTA(e) {
    const userId = e.currentTarget.dataset.userId;
    wx.navigateTo({
      url: `/pages/know-ta/know-ta?userId=${userId}`
    });
  },

  // 恢复你的【选择队友】逻辑（核心，传正确的postId）
  onSelectMember(e) {
    const postId = e.currentTarget.dataset.postId || e.currentTarget.dataset.id; // 兼容队友的data-id
    wx.navigateTo({
      url: `/pages/select-teammates/select-teammates?postId=${postId}`
    });
  },

  // 保留发起组队逻辑（无改动）
  gotoPublishTeamUp() {
    wx.navigateTo({
      url: "/pages/publish-teamup/publish-teamup"
    });
  },

  // 恢复你的重置筛选逻辑（修正队友的错误）
  resetFilters() {
    this.setData({
      currentFilter: {
        gender: "不限",
        departments: [],
        grade: "",
        skills: []
      }
    });
    this.loadTeamUpPosts();
  }
});