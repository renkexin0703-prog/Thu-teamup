// pages/select-teammates/select-teammates.js
const app = getApp();

Page({
  data: {
    applicants: [],
    selectedApplicants: [],
    postId: ""
  },

  onLoad(options) {
    const postId = options.postId;
    this.setData({ postId });
    this.loadApplicants(postId); // 加载申请人列表
  },

  // 从数据库加载申请人列表
  async loadApplicants(postId) {
    const db = wx.cloud.database();

    try {
      // 查询当前帖子的所有联系申请（从 contactRecords 集合）
      const res = await db.collection("contactRecords")
        .where({ teamUpPostId: postId }) // ← 使用相同的 postId（即 _id）
        .get();

      if (res.data.length > 0) {
        this.setData({ applicants: res.data });
      } else {
        this.setData({ applicants: [] });
        wx.showToast({ title: "暂无申请人", icon: "none" });
      }
    } catch (err) {
      console.error("加载申请人失败：", err);
      wx.showToast({ title: "加载失败，请重试", icon: "none" });
    }
  },

  onApplicantSelect(e) {
    const selectedIndexArray = e.detail.value;
    const selectedApplicants = selectedIndexArray.map(index => this.data.applicants[index]);
    this.setData({ selectedApplicants });
  },

  async onTeamUpSuccess() {
    const { selectedApplicants, postId } = this.data;
    const db = wx.cloud.database();

    if (selectedApplicants.length === 0) {
      wx.showToast({ title: "请至少选择一位队友", icon: "none" });
      return;
    }

    try {
      // 1. 更新帖子状态为已组队
      await db.collection("teamUpPosts").doc(postId).update({
        data: {
          isActive: false,
          isDeleted: true,
          selectedTeammates: selectedApplicants,
          teamUpSuccessTime: db.serverDate()
        }
      });

      // 2. 保存队友信息到发布者用户数据中
      const publisherId = app.globalData.userInfo.id;
      await db.collection("users").doc(publisherId).update({
        data: {
          teammates: db.command.addToSet(
            selectedApplicants.map(teammate => ({
              teammateId: teammate.userId,
              teammateName: teammate.userName,
              teammateAvatar: teammate.userAvatar,
              teammateDepartment: teammate.userDepartment,
              teammateGrade: teammate.userGrade,
              joinPostId: postId,
              joinTime: db.serverDate()
            }))
          )
        }
      });

      wx.showToast({ title: "组队成功！", icon: "success" });
      setTimeout(() => {
        wx.navigateBack({ delta: 2 });
      }, 1500);
    } catch (err) {
      console.error("组队失败：", err);
      wx.showToast({ title: "组队失败，请重试", icon: "none" });
    }
  }
});