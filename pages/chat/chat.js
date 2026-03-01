Page({
  data: {
    messages: [],
    inputValue: '',
    loading: false,
    currentAiReply: '',
    scrollTop: 0,
    userId: ''
  },

  onInput(e) {
    this.setData({ inputValue: e.detail.value });
  },

  onLoad() {
    const history = wx.getStorageSync('chatHistory') || [];
    this.setData({ messages: history });

    const userInfo = getApp().globalData.userInfo || wx.getStorageSync('userInfo');
    if (userInfo && userInfo.id) {
      this.setData({ userId: userInfo.id });
      if (history.length === 0) {
        this.sendWelcomeMessage();
      }
    } else {
      console.warn('未获取到用户信息');
    }
  },

  // 发送欢迎语
  async sendWelcomeMessage() {
    if (this.data.loading) return;
    this.setData({ loading: true });

    try {
      const { userId } = this.data;
      const userDoc = await this.getUserInfo(userId);
      const teamPosts = await this.getTeamPostsByUserId(userId);
      const contactRecords = await this.getContactRecordsByUserId(userId);
      const context = await this.buildContext(userDoc, teamPosts, contactRecords);

      const res = await wx.cloud.callFunction({
        name: 'askAI',
        data: {
          prompt: '发送个性化欢迎语',
          messages: [],
          userContext: context
        }
      });

      if (!res.result || !res.result.success) {
        throw new Error(res.result?.message || '欢迎语生成失败');
      }

      const welcomeMessage = { role: 'ai', content: res.result.response };
      this.setData({ messages: [welcomeMessage], loading: false });
      wx.setStorageSync('chatHistory', [welcomeMessage]);
    } catch (err) {
      console.error('欢迎语发送失败:', err);
      const fallbackWelcome = {
        role: 'ai',
        content: '你好，我是Deepseek-Teamup智能体，很高兴见到你！\
        我可以帮你解答清华校园活动、组队相关的各种问题，比如：\
        1. 最近有什么适合我的校园活动？\
        2. 帮我找软件设计大赛的组队帖；\
        3. 计算机系有哪些特色组队活动？\
        有任何想了解的，都可以尽管问～'
      };
      this.setData({ messages: [fallbackWelcome], loading: false });
      wx.setStorageSync('chatHistory', [fallbackWelcome]);
    }
  },

  // 发送普通消息
  async sendMessage() {
    const { inputValue, loading, messages, userId } = this.data;
    const trimmedInput = inputValue.trim();

    if (!trimmedInput) {
      wx.showToast({ title: '请输入提问内容', icon: 'none' });
      return;
    }
    if (loading) return;

    const userMessage = { role: 'user', content: trimmedInput };
    const newMessages = [...messages, userMessage];
    this.setData({ messages: newMessages, inputValue: '', loading: true });

    try {
      const userDoc = await this.getUserInfo(userId);
      if (!userDoc) throw new Error('无法获取用户信息');
      const teamPosts = await this.getTeamPostsByUserId(userId);
      const contactRecords = await this.getContactRecordsByUserId(userId);
      const context = await this.buildContext(userDoc, teamPosts, contactRecords);

      const res = await wx.cloud.callFunction({
        name: 'askAI',
        data: {
          prompt: trimmedInput,
          messages: newMessages.map(item => ({
            role: item.role === 'user' ? 'user' : 'assistant',
            content: item.content
          })),
          userContext: context
        }
      });

      if (!res.result || !res.result.success) {
        throw new Error(res.result?.message || 'AI 调用失败');
      }

      const aiMessage = { role: 'ai', content: res.result.response };
      const updatedMessages = [...newMessages, aiMessage];
      this.setData({ messages: updatedMessages, loading: false });
      wx.setStorageSync('chatHistory', updatedMessages.slice(-10));
    } catch (err) {
      console.error('发送消息失败:', err);
      wx.showToast({ title: err.message || '服务暂时不可用，请稍后再试', icon: 'none' });
      this.setData({ loading: false });
    }
  },

  // 获取用户信息
  async getUserInfo(openid) {
    if (!openid) return null;
    try {
      const db = wx.cloud.database();
      const result = await db.collection('users').doc(openid).get();
      return result.data;
    } catch (err) {
      console.error('获取用户信息失败:', err);
      return null;
    }
  },

  // 获取用户发布的组队帖
  async getTeamPostsByUserId(userId) {
    try {
      const db = wx.cloud.database();
      const result = await db.collection('teamUpPosts')
        .where({ userId: userId })
        .get();
      return result.data;
    } catch (err) {
      console.error('获取组队帖失败:', err);
      return [];
    }
  },

  // 🔥 新增：获取所有组队帖
  async getAllTeamPosts() {
    try {
      const db = wx.cloud.database();
      const result = await db.collection('teamUpPosts').limit(20).get();
      return result.data;
    } catch (err) {
      console.error('获取全量组队帖失败:', err);
      return [];
    }
  },

  // 🔥 新增：获取所有活动帖（和 getAllTeamPosts 平级）
  async getAllActivities() {
    try {
      const db = wx.cloud.database();
      const result = await db.collection('activities').limit(20).get();
      return result.data;
    } catch (err) {
      console.error('获取全量活动帖失败:', err);
      return [];
    }
  },

  // 🔥 新增：获取用户的联系记录
  async getContactRecordsByUserId(userId) {
    try {
      const db = wx.cloud.database();
      const result = await db.collection('contactRecords')
        .where({ userId: userId })
        .get();
      return result.data;
    } catch (err) {
      console.error('获取联系记录失败:', err);
      return [];
    }
  },

  // 优化后的 buildContext 函数（格式更清晰，模型易识别）
  async buildContext(userDoc, teamPosts, contactRecords) {
    const fakeData = require('../../utils/fake-data.js');
    // 🔥 原有：获取全量组队帖
    const allTeamPosts = await this.getAllTeamPosts();
    // 🔥 新增：获取全量活动帖（平级添加）
    const allActivities = await this.getAllActivities();

    // 1. 小程序基础规则
    const knowledgeBase = `
### 小程序使用规则
- 社区页面可发布组队帖/活动帖，寻找队友或参与活动；
- 我的页面可查看积分、礼品兑换、历史活动；
- 支持跨院系组队，提升协作效率。

### 组队规则
- 组队帖需填写技能、性别、年级等信息；
- 可申请加入他人帖子，等待对方确认；
- 组队成功后帖子自动下架。

### 院系介绍
- 计算机系：擅长编程、算法、系统开发；
- 电子系：专注硬件、嵌入式、通信技术；
- 建筑学院：擅长设计、建模、渲染；
- 自动化系：机器人、控制、智能系统方向强。
    `;

    // 2. 用户个人信息
    let userInfo = '### 当前用户信息\n暂无用户信息';
    if (userDoc) {
      const userSkills = Array.isArray(userDoc.skill) ? userDoc.skill : [];
      userInfo = `
### 当前用户信息
- 用户名：${userDoc.name || '未设置'}
- 学院：${userDoc.dept || '未设置'}
- 年级：${userDoc.grade || '未设置'}
- 性别：${userDoc.gender || '未知'}
- 技能：${userSkills.join(', ') || '暂无'}
- 微信：${userDoc.contact?.wechat || '未设置'}
      `;
    }

    // 3. 组队帖信息（用户自己的帖子）
    let teamPostInfo = '### 我的组队帖\n暂无组队帖';
    if (teamPosts.length > 0) {
      teamPostInfo = `
### 我的组队帖
${teamPosts.map(post => {
        const postSkills = Array.isArray(post.skills) ? post.skills : [];
        return `- 标题：${post.title || '无'}\n  内容：${post.content || '无'}\n  技能要求：${postSkills.join(', ') || '暂无'}\n  状态：${post.isActive ? '活跃中' : '已下架'}`;
      }).join('\n')}
      `;
    }

    // 4. 联系记录
    let contactInfo = '### 我的联系记录\n暂无联系申请';
    if (contactRecords.length > 0) {
      contactInfo = `
### 我的联系记录
${contactRecords.map(record => {
        const recordSkills = Array.isArray(record.skills) ? record.skills : [];
        return `- 来自：${record.userName || '未知'} (${record.userDepartment || '未知'})\n  技能：${recordSkills.join(', ') || '暂无'}\n  时间：${record.contactTime || '未知'}`;
      }).join('\n')}
      `;
    }

    // 5. 所有组队帖信息
    let allTeamPostsInfo = '### 所有组队帖\n暂无组队帖';
    if (allTeamPosts.length > 0) {
      allTeamPostsInfo = `
### 所有组队帖
${allTeamPosts.map(post => {
        const postSkills = Array.isArray(post.skills) ? post.skills : [];
        return `- 标题：${post.title || '无'}\n  发布人：${post.userName || '未知'}\n  院系：${post.userDepartment || '未知'}\n  技能要求：${postSkills.join(', ') || '暂无'}\n  状态：${post.isActive ? '活跃中' : '已下架'}`;
      }).join('\n')}
      `;
    }

    // 6. 🔥 新增：所有活动帖信息（和所有组队帖平级）
    let allActivitiesInfo = '### 所有活动帖\n暂无活动帖';
    if (allActivities.length > 0) {
      allActivitiesInfo = `
### 所有活动帖
${allActivities.map(activity => {
        // 匹配你 activities 集合的真实字段
        return `- 标题：${activity.title || '无'}\n  主办方：${activity.organizer || '未知'}\n  所属院系：${activity.department || '未知'}\n  队伍数量：${activity.teamCount || 0}支\n  截止时间：${activity.deadline || '无'}\n  状态：${activity.status || '未知'}`;
      }).join('\n')}
      `;
    }

    // 7. 其他参考数据
    const otherData = `
### 其他参考数据
- 活动总数：${fakeData.approvedActivities?.length || 0}
- 可选技能标签：${(Array.isArray(fakeData.filterOptions?.skills) ? fakeData.filterOptions.skills : []).join(', ') || '无'}
    `;

    // 合并并清理格式（去掉多余空格）
    const finalContext = `${knowledgeBase}${userInfo}${teamPostInfo}${contactInfo}${allTeamPostsInfo}${allActivitiesInfo}${otherData}`.replace(/\n\s+/g, '\n').trim();
    return finalContext;
  },

  clearHistory() {
    wx.showModal({
      title: '确认清空',
      content: '是否清空所有对话记录？',
      success: (res) => {
        if (res.confirm) {
          this.setData({ messages: [] });
          wx.removeStorageSync('chatHistory');
        }
      }
    });
  }
});