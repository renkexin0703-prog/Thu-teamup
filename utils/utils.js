// 工具函数：计算信誉分（后续可替换为接口调用）
export function calculateCreditScore(userData) {
  let baseScore = 60;
  // 组队成功加分
  baseScore += (userData.teamUpSuccessCount || 0) * 5;
  // 超靠谱评价加分
  baseScore += (userData.goodReviewCount || 0) * 5;
  // 投稿采纳加分
  baseScore += (userData.publishAdoptCount || 0) * 20;
  // 上限100分
  return Math.min(baseScore, 100);
}

// 工具函数：获取用户称号（后续可替换为接口调用）
export function getUserTitles(userData) {
  const titles = [];
  // 活动大神：投稿采纳≥5次
  if (userData.publishAdoptCount >= 5) {
    titles.push("活动大神");
  }
  // 超级队友：评分≥4.5 且 成功组队≥3次
  if (userData.reviewScore >= 4.5 && userData.teamUpSuccessCount >= 3) {
    titles.push("超级队友");
  }
  return titles;
}