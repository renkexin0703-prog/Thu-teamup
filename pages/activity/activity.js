const app = getApp();
const db = wx.cloud.database();
const _ = db.command; // 1. 引入查询指令

Page({
  data: {
    searchValue: '',
    searchHistory: wx.getStorageSync('searchHistory') || [],
    deptFilter: 'all',
    categoryFilter: 'all',
    sortType: 'deadline',
    loading: false,
    finished: true, 
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

  // 获取当前日期字符串 "YYYY-MM-DD" 的辅助函数
  getTodayStr() {
    const now = new Date();
    const year = now.getFullYear();
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const day = now.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  },

  // 从云端获取真实数据
  async fetchActivities() {
    this.setData({ loading: true });
    const todayStr = this.getTodayStr(); // 获取今天的日期

    try {
      // 2. 在数据库查询层面直接过滤：只获取截止日期 >= 今天的比赛
      const res = await db.collection('activities')
        .where({
          deadline: _.gte(todayStr)
        })
        .orderBy('deadline', 'asc')
        .get();

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
    const todayStr = this.getTodayStr();

    // 3. 前端二次过滤（双重保险）：确保过期的比赛绝对不显示
    list = list.filter(i => i.deadline >= todayStr);

    if (searchValue) {
      list = list.filter(i => i.title.includes(searchValue));
    }
    if (deptFilter !== 'all') {
      list = list.filter(i => i.department === deptFilter);
    }
    
    // 排序
    if (sortType === 'deadline') {
      // 修正排序逻辑，确保字符串日期能正确转换为 Date 对象比较
      list.sort((a, b) => new Date(a.deadline.replace(/-/g, '/')) - new Date(b.deadline.replace(/-/g, '/')));
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

  // 一键组队跳转
  onQuickTeamUp() {
    const title = this.data.currentActivity.title;
    this.closeActivityCard();
    wx.navigateTo({
      url: `/pages/publish-teamup/publish-teamup?title=${encodeURIComponent('【组队】' + title)}`
    });
  }
});