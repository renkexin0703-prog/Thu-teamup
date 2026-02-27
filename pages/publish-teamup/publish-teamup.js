const app = getApp();
const db = wx.cloud.database();

Page({
  data: {
    // 表单基础数据
    title: "",
    selectedGender: "",
    desc: "",
    wechat: "",
    activityId: "",

    // 筛选选项（保持 UI 一致性）
    filterOptions: {
      gender: ["不限", "男", "女"]
    },

    // 多选配置：增加 checked 属性用于控制 UI 样式
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

    selectedGrades: [], // 最终存储选中的值
    selectedSkills: []  // 最终存储选中的值
  },

  onLoad(options) {
    const globalUser = app.globalData.userInfo || wx.getStorageSync('userInfo');
    
    // 1. 登录校验
    if (!globalUser || !globalUser.id) {
      wx.showToast({ title: "请先完成微信登录", icon: "none" });
      setTimeout(() => { wx.redirectTo({ url: "/pages/login/login" }); }, 1000);
      return;
    }

    // 2. 解析活动页传参
    if (options.title) {
      // 自动解码并加上统一前缀
      const cleanTitle = decodeURIComponent(options.title);
      this.setData({ 
        title: cleanTitle.startsWith('【组队】') ? cleanTitle : "【组队】" + cleanTitle 
      });
    }
    if (options.id) {
      this.setData({ activityId: options.id });
    }

    // 3. 自动回填用户信息（技能、微信、简介）
    this.fetchUserInfoFromCloud(globalUser.id);
  },

  // 从云端获取发帖人的最新资料，预填表单
  async fetchUserInfoFromCloud(userId) {
    try {
      const res = await db.collection('users').doc(userId).get();
      const userInfo = res.data;

      // 预填微信、简介及技能多选框状态
      const skills = userInfo.skill || [];
      const updatedSkillOptions = this.data.skillOptions.map(opt => ({
        ...opt,
        checked: skills.includes(opt.value)
      }));

      this.setData({
        selectedSkills: skills,
        skillOptions: updatedSkillOptions,
        wechat: userInfo.contact?.wechat || "",
        desc: userInfo.bio || ""
      });

      // 更新全局缓存
      app.globalData.userInfo = { ...app.globalData.userInfo, ...userInfo };
    } catch (err) {
      console.error("回填用户信息失败:", err);
    }
  },

  // --- 输入监听事件 ---
  onTitleInput(e) { this.setData({ title: e.detail.value }); },
  
  onGenderSelect(e) {
    const gender = this.data.filterOptions.gender[e.detail.value];
    this.setData({ selectedGender: gender });
  },

  onDescInput(e) { this.setData({ desc: e.detail.value }); },
  
  onWechatInput(e) { this.setData({ wechat: e.detail.value }); },

  // --- 多选处理（年级/技能） ---
  onGradeChange(e) {
    const values = e.detail.value;
    const items = this.data.gradeOptions.map(opt => ({
      ...opt,
      checked: values.includes(opt.value)
    }));
    this.setData({ gradeOptions: items, selectedGrades: values });
  },

  onSkillChange(e) {
    const values = e.detail.value;
    const items = this.data.skillOptions.map(opt => ({
      ...opt,
      checked: values.includes(opt.value)
    }));
    this.setData({ skillOptions: items, selectedSkills: values });
  },

  // --- 最终提交 ---
  async submitTeamUp() {
    const { title, selectedGender, desc, wechat, selectedGrades, selectedSkills, activityId } = this.data;
    const localUser = wx.getStorageSync('userInfo') || app.globalData.userInfo;

    // 1. 必填校验
    if (!title || !selectedGender || !wechat) {
      wx.showToast({ title: "标题/性别/微信必填", icon: "none" });
      return;
    }
    if (selectedGrades.length === 0) {
      wx.showToast({ title: "请选择年级要求", icon: "none" });
      return;
    }

    wx.showLoading({ title: '正在发布...', mask: true });

    // 2. 构造符合 Community 页面渲染格式的数据
    const newPost = {
      userId: localUser.id || localUser._id,
      userName: localUser.name || "清华学子",
      userAvatar: localUser.avatar || "../../images/default-avatar.png",
      userGrade: localUser.grade || "年级未知",
      userDepartment: localUser.dept || "院系未知",
      
      title: title,
      gender: selectedGender,
      targetGrades: selectedGrades, // 数组
      targetSkills: selectedSkills, // 数组
      content: desc || "诚招队友，共同进步！",
      contactWechat: wechat,
      
      parentActivityId: activityId || "",
      createTime: db.serverDate(),
      isActive: true,
      viewCount: 0,
      applicants: []
    };

    try {
      // 3. 写入云端
      await db.collection('teamUpPosts').add({ data: newPost });
      
      wx.hideLoading();
      wx.showToast({ title: "已发布至社区", icon: "success" });
      
      // 4. 跳转回社区页并强制刷新
      setTimeout(() => {
        wx.switchTab({ 
          url: '/pages/community/community',
          success: () => {
            console.log("跳转成功");
          }
        });
      }, 1500);
    } catch (err) {
      wx.hideLoading();
      console.error("发布失败", err);
      wx.showToast({ title: "发布失败，请检查网络", icon: "none" });
    }
  }
});