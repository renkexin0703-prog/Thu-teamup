// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()
const _ = db.command

// 积分类型定义
const POINTS_TYPES = {
  SUBMIT_ACTIVITY: 'submit_activity',
  TEAM_UP_SUCCESS: 'team_up_success',
  DAILY_LOGIN: 'daily_login',
  SHARE_TO_CIRCLE: 'share_to_circle',
  EXCHANGE_GIFT: 'exchange_gift'
}

// 积分规则定义
const POINTS_RULES = {
  [POINTS_TYPES.SUBMIT_ACTIVITY]: 50,
  [POINTS_TYPES.TEAM_UP_SUCCESS]: 20,
  [POINTS_TYPES.DAILY_LOGIN]: 5,
  [POINTS_TYPES.SHARE_TO_CIRCLE]: 50
}

// 云函数入口函数
exports.main = async (event, context) => {
  const { pointsType, userId } = event
  
  // 输入参数验证
  if (!pointsType) {
    return {
      success: false,
      errorCode: 'INVALID_PARAMS',
      message: '缺少必要参数：pointsType'
    }
  }
  
  // 验证积分类型是否有效
  if (!POINTS_RULES[pointsType]) {
    return {
      success: false,
      errorCode: 'INVALID_POINTS_TYPE',
      message: '无效的积分类型'
    }
  }
  
  try {
    // 获取当前用户的 openid
    const wxContext = cloud.getWXContext()
    const openid = userId || wxContext.OPENID
    
    if (!openid) {
      return {
        success: false,
        errorCode: 'USER_NOT_LOGGED_IN',
        message: '用户未登录'
      }
    }
    
    const today = new Date().toLocaleDateString()
    const pointsToAdd = POINTS_RULES[pointsType]
    
    // 检查是否为每日登录类型，防止重复添加
    if (pointsType === POINTS_TYPES.DAILY_LOGIN) {
      try {
        const userResult = await db.collection('user_points').doc(openid).get()
        
        if (userResult.data && userResult.data.last_login_date === today) {
          return {
            success: false,
            errorCode: 'ALREADY_LOGGED_IN_TODAY',
            message: '今日已登录，无法重复获取积分',
            totalPoints: userResult.data.total_points || 0
          }
        }
      } catch (err) {
        // 用户记录不存在，继续创建
        console.log('用户积分记录不存在，将创建新记录')
      }
    }
    
    // 获取或创建用户积分记录
    let currentPoints = 0
    let isNewUser = false
    
    try {
      const userPointsDoc = await db.collection('user_points').doc(openid).get()
      
      if (userPointsDoc.data) {
        currentPoints = userPointsDoc.data.total_points || 0
      }
    } catch (err) {
      // 用户记录不存在，创建新记录
      isNewUser = true
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
    
    // 计算新积分
    const newTotalPoints = currentPoints + pointsToAdd
    
    // 更新用户积分
    await db.collection('user_points').doc(openid).update({
      data: {
        total_points: newTotalPoints,
        last_login_date: pointsType === POINTS_TYPES.DAILY_LOGIN ? today : _.set,
        update_time: new Date()
      }
    })
    
    // 记录积分变更历史
    const historyData = {
      user_id: openid,
      points_change: pointsToAdd,
      operation_type: pointsType,
      operation_name: getOperationName(pointsType),
      timestamp: new Date(),
      notes: isNewUser ? '新用户初始化' : '积分变更',
      total_points_after: newTotalPoints
    }
    
    await db.collection('points_history').add({
      data: historyData
    })
    
    console.log('积分更新成功:', {
      userId: openid,
      pointsType,
      pointsToAdd,
      newTotalPoints
    })
    
    return {
      success: true,
      message: '积分更新成功',
      data: {
        userId: openid,
        pointsChange: pointsToAdd,
        totalPoints: newTotalPoints,
        operationType: pointsType,
        operationName: getOperationName(pointsType),
        timestamp: new Date(),
        isNewUser: isNewUser
      }
    }
    
  } catch (error) {
    console.error('积分更新失败:', error)
    
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
      message: '积分更新失败：' + error.message,
      error: error.message
    }
  }
}

// 获取操作名称
function getOperationName(pointsType) {
  const operationNames = {
    [POINTS_TYPES.SUBMIT_ACTIVITY]: '投稿活动',
    [POINTS_TYPES.TEAM_UP_SUCCESS]: '组队成功',
    [POINTS_TYPES.DAILY_LOGIN]: '每日登录',
    [POINTS_TYPES.SHARE_TO_CIRCLE]: '发圈宣传',
    [POINTS_TYPES.EXCHANGE_GIFT]: '兑换礼品'
  }
  return operationNames[pointsType] || '未知操作'
}
