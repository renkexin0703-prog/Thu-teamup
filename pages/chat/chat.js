// pages/chat/chat.js
Page({
  data: {
    messages: [],
    inputValue: '',
    loading: false,
    currentAiReply: '',
    scrollTop: 0
  },

  onLoad() {
    const history = wx.getStorageSync('chatHistory') || [];
    this.setData({ messages: history });
  },

  onInput(e) {
    this.setData({ inputValue: e.detail.value });
  },

  async sendMessage() {
    const { inputValue, loading, messages } = this.data;
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
      const res = await wx.cloud.callFunction({
        name: 'askAI',
        data: {
          prompt: trimmedInput,
          messages: newMessages.map(item => ({
            role: item.role === 'user' ? 'user' : 'assistant',
            content: item.content
          }))
        }
      });
  
      if (!res.result || !res.result.success) {
        throw new Error(res.result?.message || 'AI 调用失败');
      }
  
      const aiMessage = { role: 'ai', content: res.result.response };
      const updatedMessages = [...newMessages, aiMessage];
      
      this.setData({
        messages: updatedMessages,
        loading: false, // 这里重置 loading 状态
        currentAiReply: ''
      });
  
      wx.setStorageSync('chatHistory', updatedMessages.slice(-10));
    } catch (err) {
      console.error('发送消息失败:', err);
      wx.showToast({ 
        title: err.message || '服务暂时不可用，请稍后再试', 
        icon: 'none' 
      });
      this.setData({ loading: false }); // 异常时也要重置 loading
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