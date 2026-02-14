// pages/select-skills/select-skills.js
const app = getApp();

Page({
  data: {
    skills: [],
    inputSkill: '',
    selectedSkills: []
  },

  onLoad(options) {
    const { skills } = options;
    if (skills) {
      this.setData({ selectedSkills: JSON.parse(skills) });
    }
  },

  onInputChange(e) {
    this.setData({ inputSkill: e.detail.value });
  },

  onAddSkill() {
    const { inputSkill, selectedSkills } = this.data;
    if (!inputSkill.trim()) return;

    const skill = inputSkill.trim();
    if (!selectedSkills.includes(skill)) {
      selectedSkills.push(skill);
      this.setData({
        selectedSkills,
        inputSkill: ''
      });
    }
  },

  onRemoveSkill(e) {
    const index = e.currentTarget.dataset.index;
    const selectedSkills = this.data.selectedSkills.filter((_, i) => i !== index);
    this.setData({ selectedSkills });
  },

  onConfirm() {
    wx.navigateBack({
      delta: 1,
      success: () => {
        wx.setStorageSync('selectedSkills', JSON.stringify(this.data.selectedSkills));
      }
    });
  },

  onCancel() {
    wx.navigateBack({ delta: 1 });
  }
});