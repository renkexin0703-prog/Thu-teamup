const app = getApp();
const db = wx.cloud.database();

Page({
  data: {
    searchValue: '',
    searchHistory: wx.getStorageSync('searchHistory') || [],
    deptFilter: 'all',
    categoryFilter: 'all',
    sortType: 'deadline',
    loading: false,
    finished: true, // 因为目前数据量小，设为true避免显示加载中
    activityList: [],
    activityCardShow: false,
    currentActivity: {},
    cloudActivities: [] // 存储云端原始数据
  },

  onLoad() {
    this.fetchActivities();
  },

  onShow() {
    this.fetchActivities();
  },

  // 从云端获取真实数据
  async fetchActivities() {
    this.setData({ loading: true });
    try {
      const res = await db.collection('activities').orderBy('deadline', 'asc').get();
      this.setData({
        cloudActivities: res.data,
        loading: false
      });
      this.filterActivityList(); // 获取后执行一次筛选渲染
    } catch (err) {
      console.error("云端加载失败", err);
      this.setData({ loading: false });
    }
  },

  // 综合筛选与排序逻辑
  filterActivityList() {
    let list = [...this.data.cloudActivities];
    const { searchValue, deptFilter, categoryFilter, sortType } = this.data;

    if (searchValue) {
      list = list.filter(i => i.title.includes(searchValue));
    }
    if (deptFilter !== 'all') {
      list = list.filter(i => i.department === deptFilter);
    }
    // 排序
    if (sortType === 'deadline') {
      list.sort((a, b) => new Date(a.deadline) - new Date(b.deadline));
    }
    
    this.setData({ activityList: list });
  },

  // 交互事件
  onSearchChange(e) { this.setData({ searchValue: e.detail }); this.filterActivityList(); },
  onDeptChange(e) { this.setData({ deptFilter: e.detail }); this.filterActivityList(); },
  onSortChange(e) { this.setData({ sortType: e.detail }); this.filterActivityList(); },
  
  openActivityCard(e) {
    this.setData({
      currentActivity: e.currentTarget.dataset.activity,
      activityCardShow: true
    });
  },

  closeActivityCard() { this.setData({ activityCardShow: false }); },

  // 【核心互联】一键组队跳转
  onQuickTeamUp() {
    const title = this.data.currentActivity.title;
    this.closeActivityCard();
    wx.navigateTo({
      url: `/pages/publish-teamup/publish-teamup?title=${encodeURIComponent('【组队】' + title)}`
    });
  }
});