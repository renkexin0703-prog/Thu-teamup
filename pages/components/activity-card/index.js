Component({
  properties: {
    // 控制弹窗显示/隐藏
    show: {
      type: Boolean,
      value: false
    },
    // 活动信息
    activityInfo: {
      type: Object,
      value: {
        image: '',
        title: '',
        time: '',
        address: '',
        desc: ''
      }
    }
  },

  methods: {
    // 点击遮罩关闭
    onMaskClick() {
      this.triggerEvent('close');
    },
    // 点击关闭按钮
    onClose() {
      this.triggerEvent('close');
    },
    // 确认按钮
    onConfirm() {
      this.triggerEvent('confirm');
      this.triggerEvent('close');
    }
  }
});