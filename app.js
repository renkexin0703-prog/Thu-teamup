// app.js
App({
  globalData: {
    teamUpPosts: []
  },

  onLaunch() {
    console.log("App onLaunch 执行成功！");
    const fakeData = require("./utils/fake-data.js");
    this.globalData.teamUpPosts = fakeData.teamUpPosts;
    console.log("teamUpPosts 初始化完成:", this.globalData.teamUpPosts);
  }
});