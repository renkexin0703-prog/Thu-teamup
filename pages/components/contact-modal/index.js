Component({
  properties: {
    show: {
      type: Boolean,
      value: false
    },
    contactInfo: {
      type: Object,
      value: {
        name: '',
        phone: '',
        wechat: ''
      }
    }
  },

  methods: {
    onMaskClick() {
      this.triggerEvent('close');
    },
    onClose() {
      this.triggerEvent('close');
    },
    // 复制手机号
    copyPhone() {
      wx.setClipboardData({
        data: this.data.contactInfo.phone,
        success: () => {
          wx.showToast({ title: '手机号复制成功', icon: 'success' });
        }
      });
    },
    // 复制微信
    copyWechat() {
      wx.setClipboardData({
        data: this.data.contactInfo.wechat,
        success: () => {
          wx.showToast({ title: '微信复制成功', icon: 'success' });
        }
      });
    },
    // 拨打电话
    callPhone() {
      wx.makePhoneCall({
        phoneNumber: this.data.contactInfo.phone,
        fail: () => {
          wx.showToast({ title: '拨打电话失败', icon: 'none' });
        }
      });
    }
  }
});