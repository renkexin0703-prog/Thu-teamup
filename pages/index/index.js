// pages/index/index.js
const fakeData = require("../../utils/fake-data.js");
const app = getApp();

Page({
  data: {
    // 筛选选项基础数据
    genderOptions: ['不限', '男', '女'],
    departmentOptions: fakeData.filterOptions.departments || [], // 兼容无数据场景
    sortedDepartments: [], // 排序后的院系列表
    gradeOptions: ['不限', '大一', '大二', '大三', '大四'],
    skillOptions: fakeData.filterOptions.skills || [], // 原始技能数据
    sortedSkills: [], // 排序后的技能列表（解决空白核心）
    
    // 当前筛选条件
    currentFilter: {
      gender: '不限',
      department: '',
      grade: '',
      skill: '' // 技能改为单选，替代原skills数组
    },
    
    // Picker选中索引（单索引，适配selector模式）
    genderIndex: 0,
    deptIndex: 0,
    gradeIndex: 0,
    skillIndex: 0, // 技能选中索引
    
    // 活动数据
    filteredActivities: [],
    hasUserInfo: false,
    userInfo: {},
    
    // 活动详情链接映射
    activityDetailLinks: {
      "act_001": "https://mp.weixin.qq.com/s/OvAIUdFS_TLAQub_c1xxvA",
      "act_002": "https://mp.weixin.qq.com/s/7vde-xqt6_cegGsQyVXH-Q?scene=1&click_id=15",
      "act_003": "https://mp.weixin.qq.com/s/mLRyv6QXqBrOU8J4jIwP1w?scene=1&click_id=13",
      "act_004": "https://example.com/activity4"
    }
  },

  onLoad() {
    // 初始化用户信息
    if (app.globalData.userInfo && app.globalData.userInfo.name) {
      this.setData({
        hasUserInfo: true,
        userInfo: app.globalData.userInfo
      });
    }
    
    // ========== 核心修复：初始化排序后的院系和技能列表 ==========
    // 1. 院系数据排序 + 添加“不限”
    const sortedDepartments = ['不限', ...this.data.departmentOptions].sort((a, b) => {
      return a.localeCompare(b, 'zh-CN'); // 中文拼音排序
    });
    
    // 2. 技能数据排序 + 添加“不限”（解决下拉空白）
    const sortedSkills = ['不限', ...this.data.skillOptions].sort((a, b) => {
      return a.localeCompare(b, 'zh-CN');
    });
    
    // 初始化活动列表（兼容无数据场景）
    const initActivities = fakeData.approvedActivities || [];

    this.setData({
      sortedDepartments: sortedDepartments,
      sortedSkills: sortedSkills, // 赋值排序后的技能列表
      filteredActivities: [...initActivities]
    });
  },

  // 用户授权登录
  getUserProfile() {
    wx.getUserProfile({
      desc: '用于完善会员资料',
      success: res => {
        const userInfo = res.userInfo;
        app.globalData.userInfo = app.globalData.userInfo || {};
        app.globalData.userInfo.name = userInfo.nickName;
        app.globalData.userInfo.avatar = userInfo.avatarUrl;
        this.setData({
          hasUserInfo: true,
          userInfo: app.globalData.userInfo
        });
      },
      fail: err => {
        console.error('授权失败:', err);
        wx.showToast({ title: '授权失败，请重试', icon: 'none' });
      }
    });
  },

  // 性别筛选
  onGenderChange(e) {
    const index = e.detail.value;
    const gender = this.data.genderOptions[index];
    this.setData({
      genderIndex: index,
      currentFilter: { ...this.data.currentFilter, gender }
    }, () => this.applyFilters());
  },

  // 院系筛选（单选）
  onDeptChange(e) {
    const index = e.detail.value;
    const department = this.data.sortedDepartments[index] === '不限' ? '' : this.data.sortedDepartments[index];
    this.setData({
      deptIndex: index,
      currentFilter: { ...this.data.currentFilter, department }
    }, () => this.applyFilters());
  },

  // 年级筛选
  onGradeChange(e) {
    const index = e.detail.value;
    const grade = this.data.gradeOptions[index] === '不限' ? '' : this.data.gradeOptions[index];
    this.setData({
      gradeIndex: index,
      currentFilter: { ...this.data.currentFilter, grade }
    }, () => this.applyFilters());
  },

  // ========== 核心修复：技能筛选（单选，适配排序后列表） ==========
  onSkillChange(e) {
    const index = e.detail.value;
    // 选中“不限”则清空筛选条件，否则赋值选中的技能
    const skill = this.data.sortedSkills[index] === '不限' ? '' : this.data.sortedSkills[index];
    this.setData({
      skillIndex: index, // 更新选中索引
      currentFilter: { ...this.data.currentFilter, skill } // 更新筛选条件
    }, () => this.applyFilters()); // 应用筛选
  },

  // 应用所有筛选条件
  applyFilters() {
    const { currentFilter } = this.data;
    let filtered = [...(fakeData.approvedActivities || [])];

    // 性别筛选
    if (currentFilter.gender !== '不限') {
      filtered = filtered.filter(act => act.gender === currentFilter.gender || act.gender === '不限');
    }

    // 院系筛选
    if (currentFilter.department) {
      filtered = filtered.filter(act => act.department === currentFilter.department);
    }

    // 年级筛选
    if (currentFilter.grade) {
      filtered = filtered.filter(act => act.grade === currentFilter.grade || act.grade === '不限');
    }

    // ========== 核心修复：技能筛选逻辑（适配单选） ==========
    if (currentFilter.skill) {
      filtered = filtered.filter(act => act.skills && act.skills.includes(currentFilter.skill));
    }

    this.setData({ filteredActivities: filtered });
  },

  // 一键组队
  onQuickTeamUp(e) {
    const actId = e.currentTarget.dataset.id;
    wx.showToast({
      title: `活动${actId}一键组队成功`,
      icon: 'success',
      duration: 1500
    });
  },

  // 查看详情
  onPopupDetail(e) {
    const actId = e.currentTarget.dataset.id;
    const link = this.data.activityDetailLinks[actId];
    if (link) {
      wx.navigateTo({
        url: `/pages/webview/webview?url=${encodeURIComponent(link)}`,
        fail: () => wx.showToast({ title: "跳转失败", icon: "none" })
      });
    } else {
      wx.showToast({ title: "暂无详情链接", icon: "none" });
    }
  }
});