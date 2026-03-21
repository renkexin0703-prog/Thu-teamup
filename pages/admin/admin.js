// pages/admin/admin.js
const db = wx.cloud.database();

Page({
  data: {
    inputUrl: '',
    parsing: false,
    result: null
  },

  onUrlInput(e) { this.setData({ inputUrl: e.detail.value }); },

  async onParse() {
    if (!this.data.inputUrl) return wx.showToast({ title: '链接不能为空', icon: 'none' });
    
    this.setData({ parsing: true });
    try {
      const res = await wx.cloud.callFunction({
        name: 'parseActivity',
        data: { url: this.data.inputUrl }
      });

      // 修改这里：即使 success 为 false，也把 msg 弹出来
      if (res.result && res.result.success) {
        this.setData({ result: res.result.data, parsing: false });
        wx.showToast({ title: '抓取成功' });
      } else {
        wx.showModal({
          title: '解析提示',
          content: res.result.msg || '未知错误',
          showCancel: false
        });
        this.setData({ parsing: false });
      }
    } catch (err) {
      console.error(err);
      this.setData({ parsing: false });
      wx.showToast({ title: '云函数调用失败', icon: 'none' });
    }
  },

  // 双向绑定编辑内容
  editTitle(e) { this.setData({ ['result.title']: e.detail.value }); },
  editDeadline(e) { this.setData({ ['result.deadline']: e.detail.value }); },
  editDept(e) { this.setData({ ['result.department']: e.detail.value }); },
  editContent(e) { this.setData({ ['result.content']: e.detail.value }); },

  // 保存到数据库
  async onSaveToCloud() {
    wx.showLoading({ title: '发布中...' });
    try {
      await db.collection('activities').add({
        data: {
          ...this.data.result,
          createTime: db.serverDate(),
          status: 'ongoing'
        }
      });
      wx.hideLoading();
      wx.showModal({
        title: '发布成功',
        content: '新比赛已上线并自动排序',
        showCancel: false,
        success: () => {
          this.setData({ result: null, inputUrl: '' });
        }
      });
    } catch (err) {
      wx.hideLoading();
      wx.showToast({ title: '发布失败', icon: 'none' });
    }
  }
});