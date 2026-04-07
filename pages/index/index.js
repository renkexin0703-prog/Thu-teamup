// pages/index/index.js
const app = getApp();
const db = wx.cloud.database();
const _ = db.command; // 1. 引入查询指令

Page({
  data: {
    allActivities: [], 
    hasUserInfo: false,
    userInfo: {},
    loading: false,
    // 详情链接映射（如果数据库里没有存url，暂时保留这个手动映射）
    activityDetailLinks: {
      "act_001": "https://mp.weixin.qq.com/s/OvAIUdFS_TLAQub_c1xxvA",
      "act_002": "https://mp.weixin.qq.com/s/7vde-xqt6_cegGsQyVXH-Q?scene=1&click_id=15",
      "act_003": "https://mp.weixin.qq.com/s/mLRyv6QXqBrOU8J4jIwP1w?scene=1&click_id=13",
    }
  },

  // 辅助函数：获取今天日期 YYYY-MM-DD
  getTodayStr() {
    const now = new Date();
    const year = now.getFullYear();
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const day = now.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  },

  onLoad() {
    // 1. 初始化用户信息
    if (app.globalData.userInfo && app.globalData.userInfo.name) {
      this.setData({
        hasUserInfo: true,
        userInfo: app.globalData.userInfo
      });
    }
    
    // 2. 从云数据库加载真实的比赛数据
    this.fetchCloudActivities();
  },

  // 每当回到首页都刷新一下数据，确保下架及时
  onShow() {
    this.fetchCloudActivities();
  },

  async fetchCloudActivities() {
    this.setData({ loading: true });
    const todayStr = this.getTodayStr();

    try {
      // 从 'activities' 集合中读取数据
      const res = await db.collection('activities')
        .where({
          // 核心逻辑：只获取截止日期 >= 今天 的比赛
          deadline: _.gte(todayStr)
        })
        .orderBy('deadline', 'asc') // 按截止日期先后排序
        .get();

      console.log('首页成功加载云端比赛：', res.data.length, '条');

      this.setData({
        allActivities: res.data,
        loading: false
      });
    } catch (err) {
      console.error("首页加载云端数据失败：", err);
      wx.showToast({ title: '数据加载失败', icon: 'none' });
      this.setData({ loading: false });
    }
  },

  // 一键组队：点击后携带比赛信息跳转
  onQuickTeamUp: function(e) {
    const activityId = e.currentTarget.dataset.id;
    // 从当前列表中找到对应活动
    const activity = this.data.allActivities.find(item => (item.id === activityId || item._id === activityId));
    const title = activity ? activity.title : "";

    if (!activityId) {
      wx.showToast({ title: '活动ID缺失', icon: 'none' });
      return;
    }

    wx.navigateTo({
      url: `/pages/publish-teamup/publish-teamup?id=${activityId}&title=${encodeURIComponent('【组队】' + title)}`
    });
  },

  // 查看详情
  onPopupDetail(e) {
    const act = e.currentTarget.dataset.activity; // 建议在wxml里把整个对象传过来
    const actId = e.currentTarget.dataset.id;
    
    // 优先尝试使用数据库里的 sourceUrl，如果没有则回退到本地映射
    const link = act.url || act.sourceUrl || this.data.activityDetailLinks[actId];
  
      console.log('正在跳转链接：', link);
    
    if (link) {
      wx.navigateTo({
        url: `/pages/webview/webview?url=${encodeURIComponent(link)}`
      });
    } else {
      wx.showToast({ title: "暂无详情链接", icon: "none" });
    }
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
      }
    });
  }
});