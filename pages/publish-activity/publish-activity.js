const fakeData = require("../../utils/fake-data.js");

Page({
  data: {
    filterOptions: fakeData.filterOptions,
    title: "",
    organizer: "",
    selectedDept: "",
    selectedGrade: "",
    selectedDate: "",
    selectedSkills: [],
    desc: ""
  },

  // 输入标题
  onTitleInput(e) {
    this.setData({ title: e.detail.value });
  },

  // 输入主办方
  onOrganizerInput(e) {
    this.setData({ organizer: e.detail.value });
  },

  // 选择院系
  onDeptSelect(e) {
    const dept = fakeData.filterOptions.departments[e.detail.value];
    this.setData({ selectedDept: dept });
  },

  // 选择年级
  onGradeSelect(e) {
    const grade = fakeData.filterOptions.grades[e.detail.value];
    this.setData({ selectedGrade: grade });
  },

  // 选择日期
  onDateSelect(e) {
    this.setData({ selectedDate: e.detail.value });
  },

  // 选择技能
  onSkillSelect(e) {
    const indices = e.detail.value;
    const selectedSkills = indices.map(index => fakeData.filterOptions.skills[index]);
    this.setData({ selectedSkills });
  },

  // 输入活动描述
  onDescInput(e) {
    this.setData({ desc: e.detail.value });
  },

  // 提交活动
  submitActivity() {
    const { title, organizer, selectedDept, selectedGrade, selectedDate, selectedSkills, desc } = this.data;
    
    // 数据验证
    if (!title.trim()) {
      wx.showToast({
        title: "请输入活动标题",
        icon: "none"
      });
      return;
    }
    
    if (!organizer.trim()) {
      wx.showToast({
        title: "请输入主办方",
        icon: "none"
      });
      return;
    }
    
    if (!selectedDept) {
      wx.showToast({
        title: "请选择所属院系",
        icon: "none"
      });
      return;
    }
    
    if (!selectedGrade) {
      wx.showToast({
        title: "请选择面向年级",
        icon: "none"
      });
      return;
    }
    
    if (!selectedDate) {
      wx.showToast({
        title: "请选择截止时间",
        icon: "none"
      });
      return;
    }
    
    if (!desc.trim()) {
      wx.showToast({
        title: "请输入活动描述",
        icon: "none"
      });
      return;
    }
    
    // 构建活动数据
    const activityData = {
      title: title.trim(),
      organizer: organizer.trim(),
      department: selectedDept,
      targetGrades: [selectedGrade], // 这里简化处理，实际可能需要支持多选
      deadline: selectedDate,
      requiredSkills: selectedSkills,
      description: desc.trim()
    };
    
    wx.showLoading({
      title: '提交中...',
    });
    
    // 调用云函数提交活动信息
    wx.cloud.callFunction({
      name: 'publishActivity',
      data: activityData,
      success: (res) => {
        wx.hideLoading();
        if (res.result.success) {
          wx.showToast({
            title: "提交成功！待审核",
            icon: "success"
          });
          
          // 增加积分
          wx.cloud.callFunction({
            name: 'updatePoints',
            data: {
              pointsType: 'submit_activity'
            },
            success: (pointsRes) => {
              if (pointsRes.result.success) {
                console.log('投稿活动积分获取成功:', pointsRes.result.data);
                // 更新本地积分显示
                const app = getApp();
                const newScore = pointsRes.result.data.totalPoints;
                wx.setStorageSync('userScore', newScore);
                if (app.globalData.userInfo) {
                  app.globalData.userScore = newScore;
                }
              } else {
                console.error('获取积分失败:', pointsRes.result.message);
              }
            },
            fail: (err) => {
              console.error('调用积分云函数失败:', err);
            }
          });
          
          // 返回个人中心
          setTimeout(() => {
            wx.navigateBack({
              delta: 1
            });
          }, 1500);
        } else {
          wx.showToast({
            title: res.result.message || "提交失败",
            icon: "none"
          });
        }
      },
      fail: (err) => {
        wx.hideLoading();
        console.error('调用云函数失败:', err);
        wx.showToast({
          title: "提交失败，请重试",
          icon: "none"
        });
      }
    });
  }
});