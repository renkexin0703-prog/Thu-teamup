// pages/select-teammates/select-teammates.js
const app = getApp();
const fakeData = require("../../utils/fake-data.js");

Page({
  data: {
    applicants: [],
    selectedApplicants: [],
    postId: ''
  },

  onLoad(options) {
    const postId = options.postId;
    this.setData({ postId });
    this.loadApplicants(postId);
  },

  // 加载真实申请人列表
  async loadApplicants(postId) {
    try {
      const postRes = await wx.cloud.database().collection('teamUpPosts').doc(postId).get();
      const post = postRes.data;

      if (post && post.applicants && post.applicants.length > 0) {
        this.setData({ applicants: post.applicants });
      } else {
        this.setData({ applicants: [] });
        wx.showToast({ title: "暂无申请人", icon: "none" });
      }
    } catch (err) {
      console.error("加载申请人失败：", err);
      wx.showToast({ title: "加载失败，请重试", icon: "none" });
    }
  },

  // 选择申请人
  onApplicantSelect(e) {
    const selectedIndex = e.detail.value;
    const selectedApplicants = selectedIndex.map(index => this.data.applicants[index]);
    this.setData({ selectedApplicants });
  },

  // 核心修复：组队成功后 - 更新状态+保存队友+标记删除（非活跃）
  async onTeamUpSuccess() {
    const { selectedApplicants, postId } = this.data;
    const db = wx.cloud.database();

    // 1. 校验：必须选择至少一位队友
    if (selectedApplicants.length === 0) {
      wx.showToast({ title: "请至少选择一位队友", icon: "none" });
      return;
    }

    try {
      // 2. 关键操作1：更新帖子状态（标记为「已组队/删除」，isActive=false）
      await db.collection('teamUpPosts').doc(postId).update({
        data: {
          isActive: false,          // 核心：帖子不再显示（等同于删除）
          isDeleted: true,          // 新增：显式标记删除（便于后续筛选）
          selectedTeammates: selectedApplicants, // 保存选中的队友信息
          teamUpSuccessTime: db.serverDate(),    // 组队成功时间
          updateTime: db.serverDate()
        }
      });

      // 3. 关键操作2：保存队友信息到发布者的用户数据中
      const publisherId = app.globalData.userInfo.id; // 发布者ID（当前登录用户）
      await db.collection('users').doc(publisherId).update({
        data: {
          // 追加队友信息（避免覆盖原有队友）
          teammates: db.command.addToSet({
            // 批量添加选中的队友
            ...selectedApplicants.map(teammate => ({
              teammateId: teammate.userId,
              teammateName: teammate.userName,
              teammateAvatar: teammate.userAvatar,
              teammateDepartment: teammate.userDepartment,
              teammateGrade: teammate.userGrade,
              joinPostId: postId,        // 关联的帖子ID
              joinTime: db.serverDate()
            }))
          }),
          updateTime: db.serverDate()
        }
      });

      // 4. 可选：更新全局用户信息（前端实时显示）
      app.globalData.userInfo.teammates = [
        ...(app.globalData.userInfo.teammates || []),
        ...selectedApplicants.map(teammate => ({
          teammateId: teammate.userId,
          teammateName: teammate.userName,
          teammateAvatar: teammate.userAvatar,
          joinPostId: postId
        }))
      ];

      // 5. 提示+返回
      wx.showToast({ title: "组队成功！帖子已下线", icon: "success" });
      setTimeout(() => {
        wx.navigateBack({ delta: 2 }); // 返回到社区列表页（跳过选择队友页）
      }, 1500);

    } catch (err) {
      console.error("组队失败：", err);
      wx.showToast({ title: "组队失败，请重试", icon: "none" });
    }
  }
});