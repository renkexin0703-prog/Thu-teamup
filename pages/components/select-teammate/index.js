Component({
  properties: {
    show: {
      type: Boolean,
      value: false
    },
    teammateList: {
      type: Array,
      value: []
    }
  },

  data: {
    selectedId: '' // 选中的队友ID
  },

  methods: {
    onMaskClick() {
      this.triggerEvent('close');
    },
    onClose() {
      this.triggerEvent('close');
    },
    // 选择队友
    onSelectTeammate(e) {
      this.setData({
        selectedId: e.currentTarget.dataset.id
      });
    },
    // 确认选择
    onConfirm() {
      const { selectedId, teammateList } = this.data;
      if (!selectedId) {
        wx.showToast({ title: '请选择队友', icon: 'none' });
        return;
      }
      const selectedItem = teammateList.find(item => item.id === selectedId);
      this.triggerEvent('confirm', selectedItem);
      this.triggerEvent('close');
    }
  }
});