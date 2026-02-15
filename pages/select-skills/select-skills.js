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

    // 从云数据库加载当前用户的技能
    const db = wx.cloud.database();
    const openid = app.globalData.userInfo?.id; // ✅ 使用可选链
    if (openid) {
      db.collection('users').doc(openid).get().then(res => {
        if (res.data && Array.isArray(res.data.skill)) {
          this.setData({ selectedSkills: res.data.skill });
        }
      }).catch(err => {
        console.error('加载技能失败:', err);
      });
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
    const db = wx.cloud.database();
    const openid = app.globalData.userInfo?.id; // ✅ 使用可选链
    const selectedSkills = this.data.selectedSkills;

    if (!openid) {
      wx.showToast({ title: '用户未登录', icon: 'none' });
      return;
    }

    // ✅ 使用 update 更新 skill 字段，避免覆盖其他字段
    db.collection('users').doc(openid).update({
      data: {
        skill: selectedSkills
      },
      success: () => {
        console.log('技能更新成功');
        wx.showToast({ title: '技能保存成功', icon: 'success' });
      },
      fail: (err) => {
        console.error('技能更新失败:', err);
        wx.showToast({ title: '保存失败，请重试', icon: 'none' });
      }
    });

    wx.navigateBack({
      delta: 1
    });
  },

  onCancel() {
    wx.navigateBack({ delta: 1 });
  }
});