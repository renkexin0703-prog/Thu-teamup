const fakeData = require("../../utils/fake-data.js");

Page({
  data: {
    userInfo: {},
    myActivities: [],
    contactRequests: [],
    showReviewPanel: false,
    tapCount: 0 // 头像点击计数
  },

  onLoad() {
    // 初始化数据
    this.setData({
      userInfo: fakeData.userInfo,
      myActivities: fakeData.myActivities,
      contactRequests: fakeData.contactRequests
    });
  },

  // 连续点击头像5次显示模拟审核面板
  onAvatarTap() {
    const tapCount = this.data.tapCount + 1;
    if (tapCount >= 5) {
      this.setData({
        showReviewPanel: true,
        tapCount: 0
      });
      wx.showToast({
        title: "模拟审核面板已打开",
        icon: "none"
      });
    } else {
      this.setData({ tapCount });
    }
  },

  // 模拟审核操作【审核状态相关假数据修改】
  onReviewAction(e) {
    const { activityId, action } = e.currentTarget.dataset;
    // 更新活动状态
    const updatedActivities = this.data.myActivities.map(act => {
      if (act.id === activityId) {
        if (action === "approve") {
          // 审核通过：更新状态 + 增加积分
          wx.showToast({
            title: "审核通过！+50积分",
            icon: "success"
          });
          // 更新积分
          const userInfo = { ...this.data.userInfo };
          userInfo.points += 50;
          this.setData({ userInfo });
          // 添加积分记录
          userInfo.pointsRecord.unshift({
            type: "投稿活动",
            desc: act.title,
            points: +50,
            time: new Date().toLocaleDateString()
          });
          return { ...act, status: "approved", rejectReason: "" };
        } else {
          // 审核驳回：更新状态 + 添加驳回原因
          wx.showToast({
            title: "审核驳回！",
            icon: "none"
          });
          return { ...act, status: "rejected", rejectReason: "活动主题不符合要求，建议调整后重新提交" };
        }
      }
      return act;
    });

    this.setData({
      myActivities: updatedActivities,
      showReviewPanel: false
    });
  },

  // 关闭审核面板
  closeReviewPanel() {
    this.setData({ showReviewPanel: false });
  },

  // 跳转到发布活动页
  gotoPublishActivity() {
    wx.navigateTo({
      url: "/pages/publish-activity/publish-activity"
    });
  },

  // 跳转到积分记录页
  gotoPointsRecord() {
    wx.navigateTo({
      url: "/pages/points-record/points-record"
    });
  },

  // 跳转到礼品兑换页
  gotoGiftExchange() {
    wx.navigateTo({
      url: "/pages/gift-exchange/gift-exchange"
    });
  },

  // 跳转到我的合作者页
  gotoMyPartners() {
    wx.navigateTo({
      url: "/pages/my-partners/my-partners"
    });
  },

  // 跳转到我的活动投稿页
  gotoMyActivities() {
    wx.navigateTo({
      url: "/pages/my-activities/my-activities"
    });
  },

  // 跳转到联系我的人页
  gotoContactRequests() {
    wx.navigateTo({
      url: "/pages/contact-requests/contact-requests"
    });
  }
});