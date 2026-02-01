const app = getApp(); // 获取全局实例
const fakeData = require("../../utils/fake-data.js"); // 引入假数据

Page({
  data: {
    searchValue: '',
    searchHistory: wx.getStorageSync('searchHistory') || [],
    deptFilter: 'all',
    categoryFilter: 'all',
    sortType: 'deadline',
    loading: false,
    finished: false,
    activityList: [],
    activityCardShow: false,
    currentActivity: {},
    // 假数据
    mockActivities: [
      {
        id: 1,
        title: '计算机学院编程大赛',
        organizer: '计算机学院学生会',
        dept: '计算机学院',
        category: '工科',
        deadline: '2024-06-30',
        difficulty: '中等',
        teamJoined: 12,
        teamTotal: 20,
        viewCount: 230,
        skills: ['Python', '算法']
      },
      {
        id: 2,
        title: '文学院征文比赛',
        organizer: '文学院团委',
        dept: '文学院',
        category: '文科',
        deadline: '2024-07-15',
        difficulty: '简单',
        teamJoined: 8,
        teamTotal: 15,
        viewCount: 180,
        skills: ['文案', '策划']
      },
      {
        id: 3,
        title: '理学院数学建模竞赛',
        organizer: '理学院教务处',
        dept: '理学院',
        category: '理科',
        deadline: '2024-06-25',
        difficulty: '困难',
        teamJoined: 15,
        teamTotal: 30,
        viewCount: 300,
        skills: ['数学建模', '数据分析']
      },
      {
        id: 4,
        title: '美术学院海报设计大赛',
        organizer: '美术学院学生会',
        dept: '美术学院',
        category: '美术',
        deadline: '2024-07-10',
        difficulty: '中等',
        teamJoined: 9,
        teamTotal: 25,
        viewCount: 200,
        skills: ['PS', '设计']
      }
    ]
  },

  onLoad() {
    this.initActivityList();
  },

  // 新增：每次进入页面时刷新数据
  onShow() {
    this.initActivityList(); // 刷新活动列表
  },

  // 初始化活动列表
  initActivityList() {
    let list = [...this.data.mockActivities];
    const teamPosts = [...(app.globalData?.teamUpPosts || []), ...fakeData.teamUpPosts]; // 合并全局变量和假数据
    list = list.concat(teamPosts);

    this.sortActivityList(list);
    this.setData({ activityList: list });
  },

  // 排序活动列表
  sortActivityList(list) {
    const { sortType } = this.data;
    if (sortType === 'deadline') {
      list.sort((a, b) => new Date(a.deadline) - new Date(b.deadline));
    } else if (sortType === 'viewCount') {
      list.sort((a, b) => b.viewCount - a.viewCount);
    } else if (sortType === 'teamCount') {
      list.sort((a, b) => (b.teamJoined / b.teamTotal) - (a.teamJoined / a.teamTotal));
    }
    return list;
  },

  // 搜索变化
  onSearchChange(e) {
    this.setData({ searchValue: e.detail });
  },

  // 执行搜索
  onSearch() {
    const { searchValue, mockActivities } = this.data;
    if (!searchValue) return;

    // 保存搜索历史
    let history = [...this.data.searchHistory];
    if (!history.includes(searchValue)) {
      history.unshift(searchValue);
      if (history.length > 10) history.pop();
      wx.setStorageSync('searchHistory', history);
      this.setData({ searchHistory: history });
    }

    // 筛选搜索结果（包括活动和组队帖）
    let list = mockActivities.filter(item =>
      item.title.includes(searchValue) ||
      item.dept.includes(searchValue) ||
      item.category.includes(searchValue)
    );

    const teamPosts = [...(app.globalData?.teamUpPosts || []), ...fakeData.teamUpPosts].filter(post =>
      post.title.includes(searchValue) ||
      post.userName.includes(searchValue) ||
      post.userDepartment.includes(searchValue)
    );

    list = list.concat(teamPosts);

    this.sortActivityList(list);
    this.setData({ activityList: list });
  },

  // 清空搜索
  onSearchClear() {
    this.setData({ searchValue: '' });
    this.initActivityList();
  },

  // 清空搜索历史
  clearHistory() {
    wx.removeStorageSync('searchHistory');
    this.setData({ searchHistory: [] });
  },

  // 删除单条历史
  deleteHistoryItem(e) {
    let history = [...this.data.searchHistory];
    history.splice(e.currentTarget.dataset.index, 1);
    wx.setStorageSync('searchHistory', history);
    this.setData({ searchHistory: history });
  },

  // 院系筛选变化
  onDeptChange(e) {
    this.setData({ deptFilter: e.detail });
    this.filterActivityList();
  },

  // 大类筛选变化
  onCategoryChange(e) {
    this.setData({ categoryFilter: e.detail });
    this.filterActivityList();
  },

  // 排序类型变化
  onSortChange(e) {
    this.setData({ sortType: e.detail });
    this.filterActivityList();
  },

  // 筛选活动列表
  filterActivityList() {
    const { deptFilter, categoryFilter, mockActivities } = this.data;
    let list = [...mockActivities];
    const teamPosts = [...(app.globalData?.teamUpPosts || []), ...fakeData.teamUpPosts];

    // 合并数据
    list = list.concat(teamPosts);

    // 院系筛选（适用于活动和组队帖）
    if (deptFilter !== 'all') {
      list = list.filter(item => item.dept === deptFilter || item.userDepartment === deptFilter);
    }
    // 大类筛选（适用于活动）
    if (categoryFilter !== 'all') {
      list = list.filter(item => item.category === categoryFilter);
    }
    // 排序
    this.sortActivityList(list);
    this.setData({ activityList: list });
  },

  // 加载更多（模拟）
  onLoadMore() {
    this.setData({ loading: true });
    setTimeout(() => {
      this.setData({
        loading: false,
        finished: true
      });
    }, 1000);
  },

  // 打开活动卡片
  openActivityCard(e) {
    this.setData({
      currentActivity: e.currentTarget.dataset.activity,
      activityCardShow: true
    });
  },

  // 关闭活动卡片
  closeActivityCard() {
    this.setData({ activityCardShow: false });
  },

  // 【一键组队】按钮点击事件
  onQuickTeamUp() {
    wx.navigateTo({
      url: '/pages/publish-teamup/publish-teamup'
    });
  },

});