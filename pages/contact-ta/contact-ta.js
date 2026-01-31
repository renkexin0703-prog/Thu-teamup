Page({
  data: {
    wechat: ""
  },

  onLoad(options) {
    this.setData({ wechat: options.wechat });
  },

  // 复制微信号
  copyWechat() {
    wx.setClipboardData({
      data: this.data.wechat,
      success: () => {
        wx.showToast({ title: "微信号已复制", icon: "success" });
      }
    });
  }
});