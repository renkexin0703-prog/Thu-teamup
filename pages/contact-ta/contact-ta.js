// pages/contact-ta/contact-ta.js
const app = getApp();
const fakeData = require("../../utils/fake-data.js");

Page({
  data: {
    wechat: "",
    postId: "",
    userInfo: {}
  },

  onLoad(options) {
    this.setData({
      wechat: options.wechat,
      postId: options.postId
    });

    const globalUser = app.globalData.userInfo || {};
    this.setData({ userInfo: globalUser });
  },

  copyWechat() {
    wx.setClipboardData({
      data: this.data.wechat,
      success: () => {
        wx.showToast({ title: "微信号已复制", icon: "success" });
      }
    });
  },

  async submitContact() {
    const { postId, userInfo } = this.data;

    if (!postId || !userInfo.id) {
      wx.showToast({ title: "参数不全，无法提交", icon: "none" });
      return;
    }

    const db = wx.cloud.database();

    try {
      // 1. 创建联系申请记录（写入 contactRecords 集合）
      const contactRecord = {
        userId: userInfo.id,
        userName: userInfo.name,
        userAvatar: userInfo.avatar,
        userDepartment: userInfo.department,
        userGrade: userInfo.grade,
        teamUpPostId: postId,
        applyTime: db.serverDate(),
        skills: userInfo.skills || []
      };

      // 2. 插入到 contactRecords 集合
      await db.collection("contactRecords").add({ data: contactRecord });

      // 3. 同步更新 teamUpPosts 的 applicants 字段
      await db.collection("teamUpPosts").doc(postId).update({
        data: {
          applicants: db.command.push(contactRecord)
        }
      });

      wx.showToast({ title: "申请已发送", icon: "success" });
      setTimeout(() => {
        wx.navigateBack();
      }, 1500);
    } catch (err) {
      console.error("提交失败：", err);
      wx.showToast({ title: "提交失败，请重试", icon: "none" });
    }
  }
});