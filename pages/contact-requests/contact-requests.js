// pages/contact-requests/contact-requests.js
const fakeData = require('../../fake-data.js');

Page({

  /**
   * 页面的初始数据
   */
  data: {
    contactRequests: [],
    loading: false,
    refreshCount: 0,
    lastRefreshTime: ''
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    this.updateRefreshInfo();
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow() {
    this.updateRefreshInfo();
    this.loadContactRequests();
  },

  /**
   * 更新刷新信息
   */
  updateRefreshInfo() {
    const currentTime = new Date().toLocaleString('zh-CN');
    this.setData({
      refreshCount: this.data.refreshCount + 1,
      lastRefreshTime: currentTime
    });
  },

  /**
   * 加载联系我的人列表
   */
  loadContactRequests() {
    this.setData({ loading: true });
    
    const app = getApp();
    const openid = app.globalData.userInfo?.id;
    
    if (openid) {
      const db = wx.cloud.database();
      
      // 第一步：找到用户发表的帖子的_id
      db.collection('teamUpPosts').where({
        _openid: openid
      }).get({
        success: (postsRes) => {
          if (postsRes && postsRes.data && postsRes.data.length > 0) {
            // 获取用户发表的帖子的_id列表
            const postIds = postsRes.data.map(post => post._id);
            console.log("用户发表的帖子ID:", postIds);
            
            // 第二步：在contactRecords中找到这些帖子对应的联系记录
            db.collection('contactRecords').where({
              postId: db.command.in(postIds)
            }).get({
              success: (contactsRes) => {
                this.setData({ loading: false });
                if (contactsRes && contactsRes.data) {
                  console.log("获取联系我的人数据成功:", contactsRes.data);
                  
                  // 从联系记录中提取发起人的 openid，用于到 users 集合中查头像
                  const openids = Array.from(
                    new Set(
                      (contactsRes.data || [])
                        .map(item => item._openid)
                        .filter(Boolean)
                    )
                  );
                  
                  if (openids.length > 0) {
                    db.collection('users')
                      .where({
                        _id: db.command.in(openids)
                      })
                      .get({
                        success: (usersRes) => {
                          const avatarMap = {};
                          if (usersRes && usersRes.data) {
                            usersRes.data.forEach(u => {
                              if (u && u._id) {
                                avatarMap[u._id] = u.avatar || '/images/default-avatar.png';
                              }
                            });
                          }
                          
                          const contacts = contactsRes.data.map(item => ({
                            id: item._id || item.id,
                            name: item.userName || item.name || '未知用户',
                            // 优先使用 users 表中根据 _openid 查到的头像
                            avatar: avatarMap[item._openid] || item.userAvatar || item.avatar || '/images/default-avatar.png',
                            dept: item.userDepartment || item.dept || '未知院系',
                            grade: item.userGrade || item.grade || '未知年级',
                            wechat: item.wechat || 'wx_' + (item.userId || ''),
                            skills: item.skills || [],
                            contactTime: item.applyTime || item.createTime || new Date().toLocaleString('zh-CN')
                          }));
                          
                          this.setData({ contactRequests: contacts });
                          wx.showToast({ 
                            title: `加载成功，共${contacts.length}位联系人`, 
                            icon: 'success',
                            duration: 1500
                          });
                        },
                        fail: (err) => {
                          console.error('根据 openid 获取用户头像失败，降级使用记录内头像:', err);
                          const contacts = contactsRes.data.map(item => ({
                            id: item._id || item.id,
                            name: item.userName || item.name || '未知用户',
                            avatar: item.userAvatar || item.avatar || '/images/default-avatar.png',
                            dept: item.userDepartment || item.dept || '未知院系',
                            grade: item.userGrade || item.grade || '未知年级',
                            wechat: item.wechat || 'wx_' + (item.userId || ''),
                            skills: item.skills || [],
                            contactTime: item.applyTime || item.createTime || new Date().toLocaleString('zh-CN')
                          }));
                          this.setData({ contactRequests: contacts });
                          wx.showToast({ 
                            title: `加载成功，共${contacts.length}位联系人`, 
                            icon: 'success',
                            duration: 1500
                          });
                        }
                      });
                  } else {
                    // 没有有效的 openid，直接使用记录中的头像字段
                    const contacts = contactsRes.data.map(item => ({
                      id: item._id || item.id,
                      name: item.userName || item.name || '未知用户',
                      avatar: item.userAvatar || item.avatar || '/images/default-avatar.png',
                      dept: item.userDepartment || item.dept || '未知院系',
                      grade: item.userGrade || item.grade || '未知年级',
                      wechat: item.wechat || 'wx_' + (item.userId || ''),
                      skills: item.skills || [],
                      contactTime: item.applyTime || item.createTime || new Date().toLocaleString('zh-CN')
                    }));
                    this.setData({ contactRequests: contacts });
                    wx.showToast({ 
                      title: `加载成功，共${contacts.length}位联系人`, 
                      icon: 'success',
                      duration: 1500
                    });
                  }
                } else {
                  console.log("联系我的人数据为空");
                  this.setData({ contactRequests: [] });
                  wx.showToast({ 
                    title: '暂无联系人', 
                    icon: 'none',
                    duration: 1500
                  });
                }
              },
              fail: (err) => {
                console.error("获取联系我的人数据失败:", err);
                this.setData({ loading: false });
                // 降级处理：使用假数据
                const contacts = fakeData.contactRequests.map(item => ({
                  id: item.id,
                  name: item.userName,
                  avatar: item.userAvatar || '/images/default-avatar.png',
                  dept: item.userDepartment,
                  grade: item.userGrade,
                  wechat: item.wechat || 'wx_' + item.userId,
                  skills: item.skills,
                  contactTime: item.applyTime
                }));
                this.setData({ contactRequests: contacts });
                wx.showToast({ 
                  title: '使用默认数据', 
                  icon: 'none',
                  duration: 1500
                });
              }
            });
          } else {
            console.log("用户未发表任何帖子");
            this.setData({ loading: false, contactRequests: [] });
            wx.showToast({ 
              title: '暂无联系人', 
              icon: 'none',
              duration: 1500
            });
          }
        },
        fail: (err) => {
          console.error("获取用户帖子失败:", err);
          this.setData({ loading: false });
          // 降级处理：使用假数据
          const contacts = fakeData.contactRequests.map(item => ({
            id: item.id,
            name: item.userName,
            avatar: item.userAvatar || '/images/default-avatar.png',
            dept: item.userDepartment,
            grade: item.userGrade,
            wechat: item.wechat || 'wx_' + item.userId,
            skills: item.skills,
            contactTime: item.applyTime
          }));
          this.setData({ contactRequests: contacts });
          wx.showToast({ 
            title: '使用默认数据', 
            icon: 'none',
            duration: 1500
          });
        }
      });
    } else {
      // 没有用户ID，使用假数据
      setTimeout(() => {
        try {
          const contacts = fakeData.contactRequests.map(item => ({
            id: item.id,
            name: item.userName,
            avatar: item.userAvatar || '/images/default-avatar.png',
            dept: item.userDepartment,
            grade: item.userGrade,
            wechat: item.wechat || 'wx_' + item.userId,
            skills: item.skills,
            contactTime: item.applyTime
          }));
          
          this.setData({ 
            contactRequests: contacts,
            loading: false
          });
          
          wx.showToast({ 
            title: `加载成功，共${contacts.length}位联系人`, 
            icon: 'success',
            duration: 1500
          });
          
        } catch (error) {
          console.error('加载联系人数据失败:', error);
          this.setData({ loading: false });
          wx.showToast({ 
            title: '数据加载失败', 
            icon: 'none' 
          });
        }
      }, 800);
    }
  },

  /**
   * 重新加载联系人数据
   */
  refreshContacts() {
    console.log('用户点击刷新联系人');
    wx.showLoading({ title: '重新加载中...' });
    
    const app = getApp();
    const openid = app.globalData.userInfo?.id;
    
    if (openid) {
      const db = wx.cloud.database();
      
      // 第一步：找到用户发表的帖子的_id
      db.collection('teamUpPosts').where({
        _openid: openid
      }).get({
        success: (postsRes) => {
          if (postsRes && postsRes.data && postsRes.data.length > 0) {
            // 获取用户发表的帖子的_id列表
            const postIds = postsRes.data.map(post => post._id);
            console.log("用户发表的帖子ID:", postIds);
            
            // 第二步：在contactRecords中找到这些帖子对应的联系记录
            db.collection('contactRecords').where({
              postId: db.command.in(postIds)
            }).get({
              success: (contactsRes) => {
                wx.hideLoading();
                if (contactsRes && contactsRes.data) {
                  console.log("刷新联系我的人数据成功:", contactsRes.data);
                  
                  // 从联系记录中提取发起人的 openid，用于到 users 集合中查头像
                  const openids = Array.from(
                    new Set(
                      (contactsRes.data || [])
                        .map(item => item._openid)
                        .filter(Boolean)
                    )
                  );
                  
                  if (openids.length > 0) {
                    db.collection('users')
                      .where({
                        _id: db.command.in(openids)
                      })
                      .get({
                        success: (usersRes) => {
                          const avatarMap = {};
                          if (usersRes && usersRes.data) {
                            usersRes.data.forEach(u => {
                              if (u && u._id) {
                                avatarMap[u._id] = u.avatar || '/images/default-avatar.png';
                              }
                            });
                          }
                          
                          const contacts = contactsRes.data.map(item => ({
                            id: item._id || item.id,
                            name: item.userName || item.name || '未知用户',
                            avatar: avatarMap[item._openid] || item.userAvatar || item.avatar || '/images/default-avatar.png',
                            dept: item.userDepartment || item.dept || '未知院系',
                            grade: item.userGrade || item.grade || '未知年级',
                            wechat: item.wechat || 'wx_' + (item.userId || ''),
                            skills: item.skills || [],
                            contactTime: item.applyTime || item.createTime || new Date().toLocaleString('zh-CN')
                          }));
                          
                          this.setData({ contactRequests: contacts });
                          this.updateRefreshInfo();
                          wx.showToast({ 
                            title: `刷新成功，共${contacts.length}位联系人`, 
                            icon: 'success' 
                          });
                        },
                        fail: (err) => {
                          console.error('根据 openid 获取用户头像失败，降级使用记录内头像:', err);
                          const contacts = contactsRes.data.map(item => ({
                            id: item._id || item.id,
                            name: item.userName || item.name || '未知用户',
                            avatar: item.userAvatar || item.avatar || '/images/default-avatar.png',
                            dept: item.userDepartment || item.dept || '未知院系',
                            grade: item.userGrade || item.grade || '未知年级',
                            wechat: item.wechat || 'wx_' + (item.userId || ''),
                            skills: item.skills || [],
                            contactTime: item.applyTime || item.createTime || new Date().toLocaleString('zh-CN')
                          }));
                          this.setData({ contactRequests: contacts });
                          this.updateRefreshInfo();
                          wx.showToast({ 
                            title: `刷新成功，共${contacts.length}位联系人`, 
                            icon: 'success' 
                          });
                        }
                      });
                  } else {
                    const contacts = contactsRes.data.map(item => ({
                      id: item._id || item.id,
                      name: item.userName || item.name || '未知用户',
                      avatar: item.userAvatar || item.avatar || '/images/default-avatar.png',
                      dept: item.userDepartment || item.dept || '未知院系',
                      grade: item.userGrade || item.grade || '未知年级',
                      wechat: item.wechat || 'wx_' + (item.userId || ''),
                      skills: item.skills || [],
                      contactTime: item.applyTime || item.createTime || new Date().toLocaleString('zh-CN')
                    }));
                    this.setData({ contactRequests: contacts });
                    this.updateRefreshInfo();
                    wx.showToast({ 
                      title: `刷新成功，共${contacts.length}位联系人`, 
                      icon: 'success' 
                    });
                  }
                } else {
                  console.log("联系我的人数据为空");
                  this.setData({ contactRequests: [] });
                  this.updateRefreshInfo();
                  wx.showToast({ 
                    title: '暂无联系人', 
                    icon: 'none' 
                  });
                }
              },
              fail: (err) => {
                console.error("刷新联系我的人数据失败:", err);
                wx.hideLoading();
                // 降级处理：使用假数据
                const contacts = fakeData.contactRequests.map(item => ({
                  id: item.id,
                  name: item.userName,
                  avatar: item.userAvatar || '/images/default-avatar.png',
                  dept: item.userDepartment,
                  grade: item.userGrade,
                  wechat: item.wechat || 'wx_' + item.userId,
                  skills: item.skills,
                  contactTime: item.applyTime
                }));
                this.setData({ contactRequests: contacts });
                this.updateRefreshInfo();
                wx.showToast({ 
                  title: '使用默认数据', 
                  icon: 'none' 
                });
              }
            });
          } else {
            console.log("用户未发表任何帖子");
            wx.hideLoading();
            this.setData({ contactRequests: [] });
            this.updateRefreshInfo();
            wx.showToast({ 
              title: '暂无联系人', 
              icon: 'none' 
            });
          }
        },
        fail: (err) => {
          console.error("获取用户帖子失败:", err);
          wx.hideLoading();
          // 降级处理：使用假数据
          const contacts = fakeData.contactRequests.map(item => ({
            id: item.id,
            name: item.userName,
            avatar: item.userAvatar || '/images/default-avatar.png',
            dept: item.userDepartment,
            grade: item.userGrade,
            wechat: item.wechat || 'wx_' + item.userId,
            skills: item.skills,
            contactTime: item.applyTime
          }));
          this.setData({ contactRequests: contacts });
          this.updateRefreshInfo();
          wx.showToast({ 
            title: '使用默认数据', 
            icon: 'none' 
          });
        }
      });
    } else {
      // 没有用户ID，使用假数据
      setTimeout(() => {
        try {
          const contacts = fakeData.contactRequests.map(item => ({
            id: item.id,
            name: item.userName,
            avatar: item.userAvatar || '/images/default-avatar.png',
            dept: item.userDepartment,
            grade: item.userGrade,
            wechat: item.wechat || 'wx_' + item.userId,
            skills: item.skills,
            contactTime: item.applyTime
          }));
          this.setData({ contactRequests: contacts });
          this.updateRefreshInfo();
          
          wx.hideLoading();
          wx.showToast({ 
            title: `刷新成功，共${contacts.length}位联系人`, 
            icon: 'success' 
          });
          
        } catch (error) {
          wx.hideLoading();
          console.error('刷新联系人失败:', error);
          wx.showToast({ title: '刷新失败', icon: 'none' });
        }
      }, 1000);
    }
  },

  /**
   * 查看用户详情
   */
  viewUserProfile(e) {
    const contact = e.currentTarget.dataset.contact;
    console.log('查看联系人详情:', contact);
    
    // 显示联系人详细信息
    wx.showModal({
      title: contact.name,
      content: `院系：${contact.dept}\n年级：${contact.grade}\n微信号：${contact.wechat}\n技能：${contact.skills.join('、')}\n联系时间：${contact.contactTime}`,
      showCancel: true,
      cancelText: '取消',
      confirmText: '复制微信号',
      success: (res) => {
        if (res.confirm) {
          wx.setClipboardData({
            data: contact.wechat,
            success: () => {
              wx.showToast({ title: '微信号已复制', icon: 'success' });
            }
          });
        }
      }
    });
  },

  /**
   * 分享联系人
   */
  shareContact(e) {
    const contact = e.currentTarget.dataset.contact;
    console.log('分享联系人:', contact);
    
    wx.showActionSheet({
      itemList: ['分享到微信', '保存联系人信息', '举报该用户'],
      success: (res) => {
        switch (res.tapIndex) {
          case 0:
            wx.showToast({ title: '分享功能开发中', icon: 'none' });
            break;
          case 1:
            const contactInfo = `${contact.name}\n微信号：${contact.wechat}\n院系：${contact.dept}`;
            wx.setClipboardData({
              data: contactInfo,
              success: () => {
                wx.showToast({ title: '联系人信息已复制', icon: 'success' });
              }
            });
            break;
          case 2:
            wx.showToast({ title: '举报功能开发中', icon: 'none' });
            break;
        }
      }
    });
  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh() {
    this.refreshContacts();
    wx.stopPullDownRefresh();
  }
});