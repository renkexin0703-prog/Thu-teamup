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
    filteredTeamUpPosts: [], // 显示的帖子列表
    currentUserId: '' // 当前登录用户 ID
  },

  onLoad() {
    // 【修改这里】从全局变量获取登录用户ID，而非本地缓存
    const globalUser = app.globalData.userInfo;
    let currentUserId = '';
    
    if (globalUser && globalUser.id) {
      currentUserId = globalUser.id;
      // 可选：同步到本地缓存，避免下次进入页面丢失
      wx.setStorageSync('userInfo', globalUser);
    } else {
      // 未登录则跳转登录页
      wx.showToast({ title: '请先登录', icon: 'none' });
      wx.redirectTo({ url: '/pages/login/login' });
    }
  
    this.setData({ currentUserId }); // 赋值给页面的currentUserId
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

      // 为每个帖子添加 isOwnPost 字段，用于判断是否为本人发布
      const updatedPosts = uniquePosts.map(post => ({
        ...post,
        isOwnPost: post.userId === this.data.currentUserId
      }));

      this.setData({ filteredTeamUpPosts: updatedPosts });
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

  // pages/community/community.js
onContactTA(e) {
  const postId = e.currentTarget.dataset.postId; // 获取 _id
  const wechat = e.currentTarget.dataset.wechat;
  
  wx.navigateTo({
    url: `/pages/contact-ta/contact-ta?postId=${postId}&wechat=${wechat}`
  });

  this.recordContact(postId, post.userId);
},

  // 修复：记录联系行为并更新帖子的申请人列表
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
        // 3. 新增联系记录
        await db.collection('contactRecords').add({
          data: {
            postId,
            contactedBy: currentUserId,
            contactTime: db.serverDate()
          }
        });

        // 4. 关键：把联系人信息写入帖子的applicants字段
        await db.collection('teamUpPosts').doc(postId).update({
          data: {
            applicants: db.command.addToSet({ // 避免重复添加
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


  // 点击【了解TA】
  onKnowTA(e) {
    const userId = e.currentTarget.dataset.userId;
    wx.navigateTo({
      url: `/pages/know-ta/know-ta?userId=${userId}`
    });
  },

  // 点击【选择队友】
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