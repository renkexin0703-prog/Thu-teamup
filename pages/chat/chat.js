// pages/chat/chat.js
Page({
  data: {
    messages: [],
    inputValue: '',
    loading: false,
    currentAiReply: '',
    scrollTop: 0,
    userId: ''
  },

  onLoad() {
    const history = wx.getStorageSync('chatHistory') || [];
    this.setData({ messages: history });

    // 获取用户openid
    const userInfo = getApp().globalData.userInfo || wx.getStorageSync('userInfo');
    if (userInfo && userInfo.id) {
      this.setData({ userId: userInfo.id });
      // 🔥 核心：首次进入且无聊天记录时，主动触发AI欢迎语
      if (history.length === 0) {
        this.sendWelcomeMessage();
      }
    } else {
      console.warn('未获取到用户信息');
    }
  },

  // 🔥 新增：发送AI欢迎语
  async sendWelcomeMessage() {
    if (this.data.loading) return;
    this.setData({ loading: true });

    try {
      // 1. 获取用户上下文（和正常对话一致）
      const { userId } = this.data;
      const userDoc = await this.getUserInfo(userId);
      const teamPosts = await this.getTeamPostsByUserId(userId);
      const contactRecords = await this.getContactRecordsByUserId(userId);
      const context = await this.buildContext(userDoc, teamPosts, contactRecords);

      // 2. 调用云函数，触发欢迎语
      const res = await wx.cloud.callFunction({
        name: 'askAI',
        data: {
          prompt: '发送个性化欢迎语', // 标识是欢迎语请求
          messages: [], // 无历史消息
          userContext: context
        }
      });

      if (!res.result || !res.result.success) {
        throw new Error(res.result?.message || '欢迎语生成失败');
      }

      // 3. 把欢迎语加入聊天记录
      const welcomeMessage = { role: 'ai', content: res.result.response };
      this.setData({
        messages: [welcomeMessage],
        loading: false
      });
      wx.setStorageSync('chatHistory', [welcomeMessage]);
    } catch (err) {
      console.error('欢迎语发送失败:', err);
      // 兜底固定欢迎语
      const fallbackWelcome = { 
        role: 'ai', 
        content: '你好，我是Deepseek-Teamup智能体，很高兴见到你！你可以问我任何关于活动与组队的问题，例如：“最近有什么适合水木书院同学参加的活动？”或“请帮我寻找最近三个软件设计大赛活动的组队帖子”，我很愿意为你解答。'
      };
      this.setData({
        messages: [fallbackWelcome],
        loading: false
      });
      wx.setStorageSync('chatHistory', [fallbackWelcome]);
    }
  },

  // 原有发送消息逻辑（无需修改，保留）
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
    this.setData({
      messages: newMessages,
      inputValue: '',
      loading: true
    });

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
      this.setData({
        messages: updatedMessages,
        loading: false,
        currentAiReply: ''
      });
      wx.setStorageSync('chatHistory', updatedMessages.slice(-10));
    } catch (err) {
      console.error('发送消息失败:', err);
      wx.showToast({ 
        title: err.message || '服务暂时不可用，请稍后再试', 
        icon: 'none' 
      });
      this.setData({ loading: false });
    }
  },

  // 获取用户信息（从 cloud.users 集合）
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

  // 获取该用户的组队帖（teamUpPosts）
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

  // 获取该用户的联系记录（contactRecords）
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

    // 1. 小程序基础规则
    const knowledgeBase = `
### 小程序使用规则
- 社区页面可发布组队帖，寻找队友；
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

    // 3. 组队帖信息
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

    // 5. 其他参考数据
    const otherData = `
### 其他参考数据
- 活动总数：${fakeData.approvedActivities?.length || 0}
- 可选技能标签：${(Array.isArray(fakeData.filterOptions?.skills) ? fakeData.filterOptions.skills : []).join(', ') || '无'}
    `;

    // 合并并清理格式（去掉多余空格）
    const finalContext = `${knowledgeBase}${userInfo}${teamPostInfo}${contactInfo}${otherData}`.replace(/\n\s+/g, '\n').trim();
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