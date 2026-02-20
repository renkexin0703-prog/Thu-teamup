// pages/index/index.js
const fakeData = require("../../utils/fake-data.js");
const app = getApp();

Page({
  data: {
    filterOptions: fakeData.filterOptions,
    currentFilter: {
      gender: "不限",
      departments: [],
      grade: "",
      skills: []
    },
    filteredActivities: [],
    hasUserInfo: false, // 是否已授权用户信息
    userInfo: {}, // 用户信息
    // 新增：活动ID到详情链接的映射表（修复语法错误：补全逗号）
    activityDetailLinks: {
      "act_001": "https://mp.weixin.qq.com/s/OvAIUdFS_TLAQub_c1xxvA", // 第一届“智斗大模型”
      "act_002": "https://mp.weixin.qq.com/s/7vde-xqt6_cegGsQyVXH-Q?scene=1&click_id=15", // 虚拟仿真创意设计大赛
      "act_003": "https://mp.weixin.qq.com/s/mLRyv6QXqBrOU8J4jIwP1w?scene=1&click_id=13", // 紫荆杯学生寒假电竞大赛
      "act_004": "https://example.com/activity4"  // 第九届软件设计大赛
    }
  },

  onLoad() {
    // 检查是否已登录并获取用户信息
    if (app.globalData.userInfo && app.globalData.userInfo.name) {
      this.setData({
        hasUserInfo: true,
        userInfo: app.globalData.userInfo
      });
    }

    // 初始化显示所有已审核活动
    this.setData({
      filteredActivities: fakeData.approvedActivities
    });
  },

  // 用户主动授权登录
  getUserProfile() {
    wx.getUserProfile({
      desc: '用于完善会员资料', // 声明获取用户个人信息后的用途
      success: res => {
        const userInfo = res.userInfo;
        console.log('用户信息:', userInfo);

        // 更新全局用户信息
        app.globalData.userInfo.name = userInfo.nickName;
        app.globalData.userInfo.avatar = userInfo.avatarUrl;

        // 更新页面数据
        this.setData({
          hasUserInfo: true,
          userInfo: app.globalData.userInfo
        });

        // 可选：将用户信息上传到云数据库
        wx.cloud.database().collection('users').add({
          data: {
            _id: app.globalData.userInfo.id,
            name: userInfo.nickName,
            avatar: userInfo.avatarUrl,
            createTime: new Date().toISOString()
          }
        }).then(() => {
          console.log('用户信息上传成功');
        }).catch(err => {
          console.error('用户信息上传失败:', err);
        });
      },
      fail: err => {
        console.error('获取用户信息失败:', err);
        wx.showToast({ title: '授权失败，请重试', icon: 'none' });
      }
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
    let filtered = [...fakeData.approvedActivities];

    // 性别筛选（活动本身无性别，此处仅演示逻辑）
    if (currentFilter.gender !== "不限") {
      filtered = filtered.filter(act => act.grade.includes("不限") || act.grade.includes(currentFilter.gender));
    }

    // 院系筛选
    if (currentFilter.departments.length > 0) {
      filtered = filtered.filter(act => currentFilter.departments.includes(act.department));
    }

    // 年级筛选
    if (currentFilter.grade) {
      filtered = filtered.filter(act => act.grade.includes(currentFilter.grade) || act.grade === "不限");
    }

    // 技能筛选
    if (currentFilter.skills.length > 0) {
      filtered = filtered.filter(act => currentFilter.skills.some(skill => act.skills.includes(skill)));
    }

    this.setData({ filteredActivities: filtered });
  },

  // ========== 核心：卡片底部按钮事件 ==========
  // 一键组队按钮（接收活动ID，带提示）
  onQuickTeamUp(e) {
    const actId = e.currentTarget.dataset.id;
    console.log("一键组队-活动ID：", actId);
    wx.showToast({
      title: `活动${actId}一键组队成功`,
      icon: 'success',
      duration: 1500
    });
  },

  // 查看详情按钮（跳转指定链接，修复逻辑）
  onPopupDetail(e) {
    const actId = e.currentTarget.dataset.id;
    console.log("查看详情-活动ID：", actId);
    
    // 从映射表中获取对应链接
    const link = this.data.activityDetailLinks[actId];
    
    if (link) {
      // 对链接进行编码，避免特殊字符导致跳转失败
      const encodedUrl = encodeURIComponent(link);
      // 跳转到webview页面承载外部链接
      wx.navigateTo({
        url: `/pages/webview/webview?url=${encodedUrl}`,
        fail: (err) => {
          console.error("跳转详情页失败：", err);
          wx.showToast({
            title: "跳转失败，请检查页面是否存在",
            icon: "none"
          });
        }
      });
    } else {
      wx.showToast({
        title: "暂无该活动详情链接",
        icon: "none"
      });
    }
  }
});