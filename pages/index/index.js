// pages/index/index.js
const fakeData = require("../../utils/fake-data.js");
const app = getApp();

Page({
  data: {
    // 首页只保留比赛活动数据，不设筛选索引和选项
    allActivities: [], 
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
    // 1. 初始化用户信息
    if (app.globalData.userInfo && app.globalData.userInfo.name) {
      this.setData({
        hasUserInfo: true,
        userInfo: app.globalData.userInfo
      });
    }
    
    // 2. 首页数据来源：仅使用 fakeData 中的官方活动/比赛数据
    // 确保不再从云数据库加载 teamUpPosts
    const initActivities = fakeData.approvedActivities || [];

    this.setData({
      allActivities: [...initActivities]
    });
  },

  // 用户授权登录（保持不变）
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
      }
    });
  },

  // 一键组队：点击后携带比赛信息跳转至发布页
  onQuickTeamUp: function(e) {
    const activityId = e.currentTarget.dataset.id;
    // 从当前列表中找到对应活动，获取其标题
    const activity = this.data.allActivities.find(item => (item.id === activityId || item._id === activityId));
    const title = activity ? activity.title : "";

    if (!activityId) {
      wx.showToast({ title: '活动ID缺失', icon: 'none' });
      return;
    }

    wx.navigateTo({
      url: `/pages/publish-teamup/publish-teamup?id=${activityId}&title=${encodeURIComponent(title)}`
    });
  },

  // 查看详情（保持不变）
  onPopupDetail(e) {
    const actId = e.currentTarget.dataset.id;
    const link = this.data.activityDetailLinks[actId];
    if (link) {
      wx.navigateTo({
        url: `/pages/webview/webview?url=${encodeURIComponent(link)}`
      });
    } else {
      wx.showToast({ title: "暂无详情链接", icon: "none" });
    }
  }
});