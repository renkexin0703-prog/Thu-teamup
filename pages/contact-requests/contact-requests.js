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
    
    // 模拟网络延迟，增强用户体验
    setTimeout(() => {
      try {
        // 使用fake-data.js中的联系人数据
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
  },

  /**
   * 重新加载联系人数据
   */
  refreshContacts() {
    console.log('用户点击刷新联系人');
    wx.showLoading({ title: '重新加载中...' });
    
    setTimeout(() => {
      try {
        // 使用fake-data.js中的联系人数据
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