// 【假数据区域：所有本地模拟数据都在这里，后续替换接口时只需修改此文件】
// ===================== 用户核心信息 =====================
const userInfo = {
  id: "user_001",
  name: "张三",
  avatar: "https://mmbiz.qpic.cn/mmbiz/icTdbqWNOwNRna42FI242Lcia07jQodd2FJGIYQfG0LAJGFxM4FbnQP6yfMxBgJ0F3YRqJCJ1aPAK2dQagdusBZg/0",
  gender: "男",
  grade: "大三",
  department: "计算机系",
  skills: ["Python", "微信小程序", "算法"],
  wechat: "zhangsan_dev",
  // 积分体系
  points: 285, // 50(投稿)+20*4(组队)+5*7(登录)+50(宣传) = 285
  pointsRecord: [
    { type: "投稿活动", desc: "AI创新大赛", points: +50, time: "2026-02-20" },
    { type: "组队成功", desc: "小程序开发", points: +20, time: "2026-02-25" },
    { type: "每日登录", desc: "连续登录7天", points: +35, time: "2026-02-28" },
    { type: "发圈宣传", desc: "分享活动到朋友圈", points: +50, time: "2026-02-18" }
  ],
  // 信誉系统
  creditScore: 92, // 满分100
  creditTags: ["超靠谱", "后端大神", "效率高"], // 队友评价标签
  creditDesc: "组队成功率95% | 投稿采纳率100% | 队友好评率98%",
  // 礼品兑换列表
  gifts: [
    { id: "gift_001", name: "清华文创笔记本", needPoints: 100, stock: 99 },
    { id: "gift_002", name: "技术面试券", needPoints: 200, stock: 50 },
    { id: "gift_003", name: "编程书籍", needPoints: 300, stock: 30 }
  ],
  // 我的合作者
  partners: [
    {
      id: "user_004",
      name: "赵六",
      avatar: "https://mmbiz.qpic.cn/mmbiz/icTdbqWNOwNRna42FI242Lcia07jQodd2FJGIYQfG0LAJGFxM4FbnQP6yfMxBgJ0F3YRqJCJ1aPAK2dQagdusBZg/0",
      department: "自动化系",
      grade: "大三",
      skills: ["JavaScript", "微信小程序"],
      tags: ["前端大神", "超靠谱"], // 我给对方的评价
      activePost: "寻找嵌入式开发队友" // 对方当前活跃招募帖
    },
    {
      id: "user_005",
      name: "钱七",
      avatar: "https://mmbiz.qpic.cn/mmbiz/icTdbqWNOwNRna42FI242Lcia07jQodd2FJGIYQfG0LAJGFxM4FbnQP6yfMxBgJ0F3YRqJCJ1aPAK2dQagdusBZg/0",
      department: "软件学院",
      grade: "大二",
      skills: ["Node.js", "数据库"],
      tags: ["后端大神", "耐心"],
      activePost: "" // 无活跃招募帖
    }
  ]
};

// ===================== 活动数据 =====================
// 已审核通过的活动（全体可见）
const approvedActivities = [
  {
    id: "act_001",
    title: "跨院系AI创新大赛",
    organizer: "计算机系科协",
    department: "计算机系",
    grade: "不限",
    deadline: "2026-03-15",
    teamUpCount: 12,
    status: "approved",
    cover: "https://mmbiz.qpic.cn/mmbiz_jpg/icTdbqWNOwNRna42FI242Lcia07jQodd2FJGIYQfG0LAJGFxM4FbnQP6yfMxBgJ0F3YRqJCJ1aPAK2dQagdusBZg/0",
    skills: ["Python", "深度学习", "算法"]
  },
  {
    id: "act_002",
    title: "人文与科技跨界论坛",
    organizer: "新雅书院",
    department: "新雅书院",
    grade: "大二至大四",
    deadline: "2026-03-20",
    teamUpCount: 8,
    status: "approved",
    cover: "https://mmbiz.qpic.cn/mmbiz_jpg/icTdbqWNOwNRna42FI242Lcia07jQodd2FJGIYQfG0LAJGFxM4FbnQP6yfMxBgJ0F3YRqJCJ1aPAK2dQagdusBZg/0",
    skills: ["文案", "策划", "沟通"]
  }
];

// 待审核/驳回的活动（仅自己可见）【审核状态相关假数据区域】
const myActivities = [
  {
    id: "act_003",
    title: "校园创业孵化营",
    organizer: "张三（计算机系）",
    department: "经管学院",
    grade: "大三至研二",
    deadline: "2026-04-01",
    teamUpCount: 0,
    status: "pending", // pending-待审核 approved-已通过 rejected-已驳回
    rejectReason: "",
    skills: ["商业分析", "PPT制作", "路演"]
  },
  {
    id: "act_004",
    title: "编程竞赛集训营",
    organizer: "张三（计算机系）",
    department: "计算机系",
    grade: "大一至大三",
    deadline: "2026-03-10",
    teamUpCount: 0,
    status: "rejected",
    rejectReason: "活动时间与校赛冲突，建议调整后重新提交",
    skills: ["C++", "算法", "数据结构"]
  }
];

// ===================== 社区组队数据 =====================
const teamUpPosts = [
  {
    id: "team_001",
    userId: "user_002",
    userName: "李四",
    userAvatar: "https://mmbiz.qpic.cn/mmbiz/icTdbqWNOwNRna42FI242Lcia07jQodd2FJGIYQfG0LAJGFxM4FbnQP6yfMxBgJ0F3YRqJCJ1aPAK2dQagdusBZg/0",
    userDepartment: "电子系",
    userGrade: "大二",
    gender: "不限",
    title: "寻找AI大赛队友",
    content: "需要擅长Python和深度学习的同学，要求认真负责，每周能线下讨论",
    skills: ["Python", "深度学习"],
    contactWechat: "lisi_2026",
    viewCount: 45,
    isActive: true // true-活跃 false-已组队下架
  },
  {
    id: "team_002",
    userId: "user_003",
    userName: "王五",
    userAvatar: "https://mmbiz.qpic.cn/mmbiz/icTdbqWNOwNRna42FI242Lcia07jQodd2FJGIYQfG0LAJGFxM4FbnQP6yfMxBgJ0F3YRqJCJ1aPAK2dQagdusBZg/0",
    userDepartment: "建筑学院",
    userGrade: "大四",
    gender: "女",
    title: "建筑设计竞赛组队",
    content: "需要有建模和渲染经验的伙伴，目标冲奖",
    skills: ["Rhino", "V-Ray", "PS"],
    contactWechat: "wangwu_design",
    viewCount: 32,
    isActive: true
  },
  {
    id: "team_003",
    userId: "user_001", // 当前用户发起的组队
    userName: "张三",
    userAvatar: "https://mmbiz.qpic.cn/mmbiz/icTdbqWNOwNRna42FI242Lcia07jQodd2FJGIYQfG0LAJGFxM4FbnQP6yfMxBgJ0F3YRqJCJ1aPAK2dQagdusBZg/0",
    userDepartment: "计算机系",
    userGrade: "大三",
    gender: "男",
    title: "小程序开发组队",
    content: "开发跨院系活动平台小程序，需要前端和后端同学",
    skills: ["微信小程序", "JavaScript", "Node.js"],
    contactWechat: "zhangsan_dev",
    viewCount: 68,
    isActive: true
  }
];

// 联系我的组队申请
const contactRequests = [
  {
    id: "req_001",
    userId: "user_004",
    userName: "赵六",
    userAvatar: "https://mmbiz.qpic.cn/mmbiz/icTdbqWNOwNRna42FI242Lcia07jQodd2FJGIYQfG0LAJGFxM4FbnQP6yfMxBgJ0F3YRqJCJ1aPAK2dQagdusBZg/0",
    userDepartment: "自动化系",
    userGrade: "大三",
    teamUpPostId: "team_003",
    applyTime: "2026-02-28 15:30",
    skills: ["JavaScript", "微信小程序"]
  },
  {
    id: "req_002",
    userId: "user_005",
    userName: "钱七",
    userAvatar: "https://mmbiz.qpic.cn/mmbiz/icTdbqWNOwNRna42FI242Lcia07jQodd2FJGIYQfG0LAJGFxM4FbnQP6yfMxBgJ0F3YRqJCJ1aPAK2dQagdusBZg/0",
    userDepartment: "软件学院",
    userGrade: "大二",
    teamUpPostId: "team_003",
    applyTime: "2026-02-28 16:10",
    skills: ["Node.js", "数据库"]
  }
];

// 筛选选项数据
const filterOptions = {
  gender: ["不限", "男", "女"],
  departments: ["计算机系", "电子系", "新雅书院", "经管学院", "建筑学院", "自动化系", "软件学院"],
  grades: ["大一", "大二", "大三", "大四", "研一", "研二"],
  skills: ["Python", "深度学习", "Rhino", "V-Ray", "PS", "微信小程序", "JavaScript", "Node.js", "算法", "文案"]
};

module.exports = {
  userInfo,
  approvedActivities,
  myActivities,
  teamUpPosts,
  contactRequests,
  filterOptions
};
