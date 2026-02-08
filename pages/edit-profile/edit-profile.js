// pages/edit-profile/edit-profile.js
const fakeData = require("../../utils/fake-data.js");

Page({
  data: {
    userInfo: {},
    filterOptions: fakeData.filterOptions,
    name: "",
    gender: "",
    grade: "",
    department: "",
    skills: [],
    wechat: ""
  },

  onLoad() {
    // 获取当前用户信息（从本地缓存优先）
    const localUserInfo = wx.getStorageSync('userInfo') || {};
    const defaultUserInfo = fakeData.userInfo;

    this.setData({
      userInfo: localUserInfo,
      name: localUserInfo.name || defaultUserInfo.name,
      gender: localUserInfo.gender || defaultUserInfo.gender,
      grade: localUserInfo.grade || defaultUserInfo.grade,
      department: localUserInfo.dept || defaultUserInfo.department,
      skills: localUserInfo.skill ? localUserInfo.skill.split(',') : defaultUserInfo.skills,
      wechat: localUserInfo.wechat || defaultUserInfo.wechat
    });
  },

  // 输入姓名
  onNameInput(e) {
    this.setData({ name: e.detail.value });
  },

  // 选择性别
  onGenderSelect(e) {
    const gender = this.data.filterOptions.gender[e.detail.value];
    this.setData({ gender });
  },

  // 选择年级
  onGradeSelect(e) {
    const grade = this.data.filterOptions.grades[e.detail.value];
    this.setData({ grade });
  },

  // 选择院系
  onDeptSelect(e) {
    const department = this.data.filterOptions.departments[e.detail.value];
    this.setData({ department });
  },

  // 选择技能
  onSkillSelect(e) {
    const skillIndexes = e.detail.value;
    const skills = skillIndexes.map(idx => this.data.filterOptions.skills[idx]);
    this.setData({ skills });
  },

  // 输入微信号
  onWechatInput(e) {
    this.setData({ wechat: e.detail.value });
  },

  // 提交修改
  onSubmit() {
    const { name, gender, grade, department, skills, wechat } = this.data;

    // 简单校验
    if (!name || !gender || !grade || !department || !wechat) {
      wx.showToast({
        title: "请填写必填项",
        icon: "none"
      });
      return;
    }

    // 1. 保存到本地缓存
    const editForm = {
      name,
      gender,
      grade,
      dept: department,
      skill: skills.join(','),
      contact: {
        wechat
      }
    };
    wx.setStorageSync('userInfo', editForm);

    // 2. 同步到全局变量（可选）
    const app = getApp();
    app.globalData.userInfo = {
      ...app.globalData.userInfo,
      ...editForm
    };

    // 3. 强制覆盖云数据库（替换“微信用户”）
    const db = wx.cloud.database();
    const currentUser = app.globalData.userInfo;
    db.collection('users').doc(currentUser.id).set({
      data: {
        name: editForm.name || currentUser.name,
        gender: editForm.gender,
        grade: editForm.grade,
        dept: editForm.dept,
        skill: editForm.skill,
        contact: editForm.contact,
        avatar: currentUser.avatar,
        createTime: db.serverDate(),
        updateTime: db.serverDate()
      },
      success: () => {
        console.log('云数据库信息覆盖成功');
      },
      fail: (err) => {
        console.error('云数据库同步失败:', err);
      }
    });

    // 4. 提示并返回
    wx.showToast({
      title: "保存成功！",
      icon: "success"
    });

    setTimeout(() => {
      wx.navigateBack({
        delta: 1
      });
    }, 1500);
  }
});