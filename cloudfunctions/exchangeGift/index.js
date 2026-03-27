// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()
const _ = db.command

// 云函数入口函数
exports.main = async (event, context) => {
  const { giftId, giftName, pointsCost } = event
  
  // 输入参数验证
  if (!giftId || !giftName || !pointsCost) {
    return {
      success: false,
      errorCode: 'INVALID_PARAMS',
      message: '缺少必要参数：giftId, giftName, pointsCost'
    }
  }
  
  if (pointsCost <= 0) {
    return {
      success: false,
      errorCode: 'INVALID_POINTS_COST',
      message: '积分消耗必须大于0'
    }
  }
  
  try {
    // 获取当前用户的 openid
    const wxContext = cloud.getWXContext()
    const openid = wxContext.OPENID
    
    if (!openid) {
      return {
        success: false,
        errorCode: 'USER_NOT_LOGGED_IN',
        message: '用户未登录'
      }
    }
    
    // 获取用户当前积分
    let currentPoints = 0
    
    try {
      const userPointsDoc = await db.collection('user_points').doc(openid).get()
      
      if (userPointsDoc.data) {
        currentPoints = userPointsDoc.data.total_points || 0
      } else {
        // 用户积分记录不存在，创建新记录
        await db.collection('user_points').add({
          data: {
            _id: openid,
            total_points: 0,
            last_login_date: '',
            create_time: new Date(),
            update_time: new Date()
          }
        })
      }
    } catch (err) {
      // 用户记录不存在，创建新记录
      await db.collection('user_points').add({
        data: {
          _id: openid,
          total_points: 0,
          last_login_date: '',
          create_time: new Date(),
          update_time: new Date()
        }
      })
    }
    
    // 检查积分是否足够
    if (currentPoints < pointsCost) {
      return {
        success: false,
        errorCode: 'INSUFFICIENT_POINTS',
        message: '积分不足',
        currentPoints: currentPoints,
        requiredPoints: pointsCost
      }
    }
    
    // 计算新积分
    const newTotalPoints = currentPoints - pointsCost
    
    // 更新用户积分
    await db.collection('user_points').doc(openid).update({
      data: {
        total_points: newTotalPoints,
        update_time: new Date()
      }
    })
    
    // 记录积分变更历史（负值表示消耗）
    const historyData = {
      user_id: openid,
      points_change: -pointsCost,
      operation_type: 'exchange_gift',
      operation_name: '兑换礼品',
      timestamp: new Date(),
      notes: `兑换礼品：${giftName}`,
      total_points_after: newTotalPoints
    }
    
    await db.collection('points_history').add({
      data: historyData
    })
    
    console.log('礼品兑换成功:', {
      userId: openid,
      giftId,
      giftName,
      pointsCost,
      newTotalPoints
    })
    
    return {
      success: true,
      message: '兑换成功',
      data: {
        userId: openid,
        giftId: giftId,
        giftName: giftName,
        pointsCost: pointsCost,
        totalPoints: newTotalPoints,
        timestamp: new Date()
      }
    }
    
  } catch (error) {
    console.error('礼品兑换失败:', error)
    
    // 根据错误类型返回不同的错误码
    let errorCode = 'UNKNOWN_ERROR'
    if (error.message && error.message.includes('database')) {
      errorCode = 'DATABASE_ERROR'
    } else if (error.message && error.message.includes('network')) {
      errorCode = 'NETWORK_ERROR'
    }
    
    return {
      success: false,
      errorCode,
      message: '兑换失败：' + error.message,
      error: error.message
    }
  }
}
