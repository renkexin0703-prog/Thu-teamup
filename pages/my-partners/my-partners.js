const fakeData = require("../../utils/fake-data.js");

Page({
  data: {
    userInfo: fakeData.userInfo
  },

  // 评价队友
  evaluatePartner(e) {
    const partnerId = e.currentTarget.dataset.partnerId;
    wx.showActionSheet({
      itemList: ["超靠谱", "技术大神", "效率高", "耐心", "沟通顺畅"],
      success: (res) => {
        const tag = ["超靠谱", "技术大神", "效率高", "耐心", "沟通顺畅"][res.tapIndex];
        const userInfo = { ...this.data.userInfo };
        // 更新队友标签
        userInfo.partners = userInfo.partners.map(p => {
          if (p.id === partnerId) {
            if (!p.tags.includes(tag)) {
              p.tags.push(tag);
            }
          }
          return p;
        });
        this.setData({ userInfo });
        wx.showToast({
          title: `已评价：${tag}`,
          icon: "success"
        });
      }
    });
  }
});