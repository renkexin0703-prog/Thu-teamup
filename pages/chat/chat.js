// pages/chat/chat.js
Page({
  data: {
    messages: [],
    inputValue: '',
    loading: false
  },

  onLoad() {
    const history = wx.getStorageSync('chatHistory') || [];
    this.setData({ messages: history });
  },

  onInput(e) {
    this.setData({ inputValue: e.detail.value });
  },

  async sendMessage() {
    const { inputValue, messages } = this.data;
    if (!inputValue.trim()) return;

    const userMessage = { role: 'user', content: inputValue };
    const newMessages = [...messages, userMessage];
    this.setData({ messages: newMessages, inputValue: '', loading: true });

    try {
      const res = await wx.cloud.callFunction({
        name: 'askAI',
        data: {
          prompt: inputValue
        }
      });

      if (res.result.success) {
        const aiMessage = { role: 'ai', content: res.result.response };
        const updatedMessages = [...newMessages, aiMessage];
        this.setData({ messages: updatedMessages, loading: false });

        // 保存到本地缓存
        wx.setStorageSync('chatHistory', updatedMessages.slice(-10));
      } else {
        throw new Error(res.result.message);
      }
    } catch (err) {
      console.error('调用 AI 失败:', err);
      wx.showToast({ title: '服务暂时不可用，请稍后再试', icon: 'none' });
      this.setData({ loading: false });
    }
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