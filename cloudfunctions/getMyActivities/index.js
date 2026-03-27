// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

// 云函数入口函数
exports.main = async (event, context) => {
  try {
    // 获取当前用户的 openid
    const wxContext = cloud.getWXContext()
    const openid = wxContext.OPENID
    
    if (!openid) {
      return {
        success: false,
        message: '用户未登录'
      }
    }
    
    // 查询用户的活动投稿
    const result = await db.collection('activities')
      .where({
        _openid: openid
      })
      .orderBy('createdAt', 'desc')
      .get()
    
    console.log('查询活动投稿成功:', result)
    
    return {
      success: true,
      message: '查询活动投稿成功',
      activities: result.data
    }
  } catch (error) {
    console.error('查询活动投稿失败:', error)
    return {
      success: false,
      message: '查询活动投稿失败',
      error: error.message
    }
  }
}