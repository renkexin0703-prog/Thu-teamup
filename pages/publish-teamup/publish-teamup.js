const app = getApp();
const fakeData = require("../../utils/fake-data.js");

Page({
  data: {
    filterOptions: fakeData.filterOptions,
    title: "",
    selectedGender: "",
    desc: "",
    wechat: "",
    // 定义多选选项，增加 checked 属性用于控制 UI
    gradeOptions: [
      { name: '大一', value: '大一', checked: false },
      { name: '大二', value: '大二', checked: false },
      { name: '大三', value: '大三', checked: false },
      { name: '大四', value: '大四', checked: false },
      { name: '不限', value: '不限', checked: false }
    ],
    skillOptions: [
      { name: '前端', value: '前端', checked: false },
      { name: '后端', value: '后端', checked: false },
      { name: '设计', value: '设计', checked: false },
      { name: '算法', value: '算法', checked: false },
      { name: '不限', value: '不限', checked: false }
    ],
    selectedGrades: [], 
    selectedSkills: [], 
    activityId: ""      
  },

  onLoad(options) {
    const globalUser = app.globalData.userInfo || {};
    // ===== 合并双方的登录校验逻辑（更严谨）=====
    if (!globalUser.id && !wx.getStorageSync('userInfo')) {
      wx.showToast({ title: "请先完成微信登录", icon: "none" });
      setTimeout(() => {
        wx.redirectTo({ url: "/pages/login/login" });
      }, 1000);
      return;
    }

    // ===== 保留你本地的传参解析逻辑 + 队友的比赛ID/标题逻辑 =====
    // 1. 解析原有标题/技能参数
    if (options.title) {
      // 优先用队友的逻辑：自动加【组队】前缀
      this.setData({ title: "【组队】" + decodeURIComponent(options.title) });
    }
    if (options.skills) {
      const skills = decodeURIComponent(options.skills).split(",");
      this.setData({ selectedSkills: skills });
    }
    // 2. 新增：接收队友的比赛ID参数
    if (options.id) {
      this.setData({ activityId: options.id });
    }

    // ===== 保留你本地的云端获取用户信息逻辑 =====
    this.fetchUserInfoFromCloud(globalUser.id);
  },

  // ===== 保留你新增的云端获取用户信息方法 =====
  async fetchUserInfoFromCloud(userId) {
    const db = wx.cloud.database();
    try {
      const res = await db.collection('users').doc(userId).get();
      const userInfo = res.data;

      // 更新页面数据中的技能和其他字段
      this.setData({
        selectedSkills: userInfo.skill || [], // ✅ 使用正确的字段名 skill
        wechat: userInfo.contact?.wechat || "", // ✅ 使用 contact.wechat
        desc: userInfo.bio || ""
      });

      // 同步到全局变量和本地缓存
      app.globalData.userInfo = {
        ...app.globalData.userInfo,
        ...userInfo
      };
      wx.setStorageSync('userInfo', userInfo);
    } catch (err) {
      console.error("获取用户信息失败:", err);
      wx.showToast({ title: "获取用户信息失败", icon: "none" });
    }
  },

  // 输入监听
  onTitleInput(e) { this.setData({ title: e.detail.value }); },
  onGenderSelect(e) {
    const gender = this.data.filterOptions.gender[e.detail.value];
    this.setData({ selectedGender: gender });
  },
  onDescInput(e) { this.setData({ desc: e.detail.value }); },
  onWechatInput(e) { this.setData({ wechat: e.detail.value }); },

  // 处理年级多选：同步 UI 状态
  onGradeChange(e) {
    const values = e.detail.value;
    const items = this.data.gradeOptions;
    for (let i = 0; i < items.length; i++) {
      items[i].checked = values.includes(items[i].value);
    }
    this.setData({ 
      gradeOptions: items,
      selectedGrades: values 
    });
  },

  // 处理技能多选：同步 UI 状态
  onSkillChange(e) {
    const values = e.detail.value;
    const items = this.data.skillOptions;
    for (let i = 0; i < items.length; i++) {
      items[i].checked = values.includes(items[i].value);
    }
    this.setData({ 
      skillOptions: items,
      selectedSkills: values 
    });
  },

  async submitTeamUp() {
    const { title, selectedGender, desc, wechat, selectedGrades, selectedSkills, activityId } = this.data;
    const db = wx.cloud.database();
    
    // 获取当前发帖人的详细信息
    const globalUser = app.globalData.userInfo || {};
    const localUser = wx.getStorageSync('userInfo') || {};
    const finalUser = { ...globalUser, ...localUser };

    // 基础校验
    if (!title || !selectedGender || !wechat) {
      wx.showToast({ title: "标题/性别/微信必填", icon: "none" });
      return;
    }
    if (selectedGrades.length === 0) {
      wx.showToast({ title: "请至少选一个年级要求", icon: "none" });
      return;
    }

    wx.showLoading({ title: '正在发布...', mask: true });

    const newPost = {
      userId: finalUser.id || finalUser._id,
      userName: finalUser.name || finalUser.nickName || "清华学子",
      userAvatar: finalUser.avatar || finalUser.avatarUrl || "../../images/default-avatar.png",
      userGrade: finalUser.grade || "年级未知",
      userDepartment: finalUser.dept || finalUser.department || "院系未知",
      
      // 组队需求核心数据
      title: title,
      gender: selectedGender,
      targetGrades: selectedGrades, // 数组：['大一', '大二']
      targetSkills: selectedSkills, // 数组：['前端', '算法']
      content: desc || "诚招队友，共同进步！",
      contactWechat: wechat,
      
      parentActivityId: activityId, // 关联首页的特定比赛
      createTime: db.serverDate(),
      isActive: true,
      applicants: [], // 预留申请列表
      type: "COMMUNITY_POST" 
    };

    try {
      await db.collection('teamUpPosts').add({ data: newPost });
      wx.hideLoading();
      wx.showToast({ title: "已发布至社区", icon: "success" });
      
      // 延迟跳转，让用户看清成功提示
      setTimeout(() => {
        wx.switchTab({ 
          url: '/pages/community/community',
          success: () => {
            // 提示：跳转后社区页会自动触发 onShow 刷新列表
          }
        });
      }, 1500);
    } catch (err) {
      wx.hideLoading();
      console.error("云数据库写入失败", err);
      wx.showToast({ title: "发布失败，请重试", icon: "none" });
    }
  }
});