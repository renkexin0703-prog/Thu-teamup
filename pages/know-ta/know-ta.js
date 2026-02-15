// pages/know-ta/know-ta.js
const app = getApp();

Page({
  data: {
    userProfile: {},
    userPosts: []
  },

  onLoad(options) {
    const userId = options.userId;
    if (!userId) {
      wx.showToast({ title: '参数错误', icon: 'none' });
      return;
    }

    const db = wx.cloud.database();

    // 1. 先从 users 集合查询用户资料
    db.collection('users')
      .doc(userId)
      .get()
      .then(userRes => {
        if (userRes.data) {
          const userData = userRes.data;
          // 2. 再从 teamUpPosts 集合查询该用户的帖子
          return db.collection('teamUpPosts')
            .where({ userId: userId })
            .get()
            .then(postsRes => {
              const posts = postsRes.data || [];
              this.setData({
                userProfile: {
                  name: userData.name || '未知用户',
                  gender: userData.gender || '未填写',
                  grade: userData.grade || '未填写',
                  department: userData.dept || '未填写', // users 集合里是 dept
                  skills: userData.skill ? userData.skill.join('、') : '未填写', // users 集合里是 skill
                  bio: userData.bio || '暂无简介'
                },
                userPosts: posts
              });
            });
        } else {
          wx.showToast({ title: '未找到用户信息', icon: 'none' });
        }
      })
      .catch(err => {
        console.error('查询失败:', err);
        wx.showToast({ title: '加载失败，请重试', icon: 'none' });
      });
  }
});