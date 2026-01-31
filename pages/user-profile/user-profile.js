const fakeData = require("../../utils/fake-data.js");

Page({
  data: {
    userProfile: {}
  },

  onLoad(options) {
    const userId = options.userId;
    const user = fakeData.teamUpPosts.find(post => post.userId === userId);
    if (user) {
      this.setData({
        userProfile: {
          name: user.userName,
          gender: user.gender,
          grade: user.userGrade,
          department: user.userDepartment,
          skills: user.skills.join("、")
        }
      });
    }
  }
});