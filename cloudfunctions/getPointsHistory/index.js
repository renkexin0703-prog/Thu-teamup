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
    
    console.log('获取用户 openid 成功:', openid)
    
    if (!openid) {
      return {
        success: false,
        errorCode: 'USER_NOT_LOGGED_IN',
        message: '用户未登录'
      }
    }
    
    try {
      // 查询用户积分记录
      console.log('开始查询 user_points 集合')
      const userPointsResult = await db.collection('user_points').doc(openid).get()
      console.log('查询 user_points 集合成功:', userPointsResult)
      
      if (!userPointsResult.data) {
        console.log('用户积分记录不存在，返回空数据')
        return {
          success: true,
          message: '用户暂无积分记录',
          data: {
            totalPoints: 0,
            lastLoginDate: '',
            history: []
          }
        }
      }
      
      try {
        // 查询积分历史记录
        console.log('开始查询 points_history 集合')
        const historyResult = await db.collection('points_history')
          .where({
            user_id: openid
          })
          .orderBy('timestamp', 'desc')
          .limit(50)
          .get()
        console.log('查询 points_history 集合成功:', historyResult)
        
        console.log('查询积分历史成功:', {
          userId: openid,
          totalPoints: userPointsResult.data.total_points,
          historyCount: historyResult.data.length
        })
        
        return {
          success: true,
          message: '查询积分历史成功',
          data: {
            userId: openid,
            totalPoints: userPointsResult.data.total_points || 0,
            lastLoginDate: userPointsResult.data.last_login_date || '',
            history: historyResult.data.map(item => ({
              id: item._id,
              pointsChange: item.points_change,
              operationType: item.operation_type,
              operationName: item.operation_name,
              timestamp: item.timestamp,
              notes: item.notes,
              totalPointsAfter: item.total_points_after
            }))
          }
        }
      } catch (historyError) {
        console.error('查询 points_history 集合失败:', historyError)
        return {
          success: false,
          errorCode: 'HISTORY_QUERY_ERROR',
          message: '查询积分历史记录失败',
          error: historyError.message
        }
      }
    } catch (userPointsError) {
      console.error('查询 user_points 集合失败:', userPointsError)
      return {
        success: false,
        errorCode: 'USER_POINTS_QUERY_ERROR',
        message: '查询用户积分记录失败',
        error: userPointsError.message
      }
    }
  } catch (error) {
    console.error('查询积分历史失败:', error)
    
    let errorCode = 'UNKNOWN_ERROR'
    if (error.message && error.message.includes('database')) {
      errorCode = 'DATABASE_ERROR'
    } else if (error.message && error.includes('network')) {
      errorCode = 'NETWORK_ERROR'
    }
    
    return {
      success: false,
      errorCode,
      message: '查询积分历史失败',
      error: error.message
    }
  }
}