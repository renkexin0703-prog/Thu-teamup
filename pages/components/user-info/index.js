Component({
  properties: {
    show: {
      type: Boolean,
      value: false
    },
    userInfo: {
      type: Object,
      value: {
        avatar: '',
        nickname: '',
        phone: '',
        gender: 0,
        regTime: ''
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
    onConfirm() {
      this.triggerEvent('confirm');
      this.triggerEvent('close');
    }
  }
});