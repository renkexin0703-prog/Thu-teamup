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
    
    // 接收并验证前端传递的活动信息数据
    const { title, organizer, department, targetGrades, deadline, requiredSkills, description } = event
    
    // 数据验证
    if (!title || !organizer || !department || !targetGrades || !deadline || !description) {
      return {
        success: false,
        message: '请填写所有必填字段'
      }
    }
    
    // 安全过滤，防止 XSS
    const safeTitle = title.trim()
    const safeOrganizer = organizer.trim()
    const safeDepartment = department.trim()
    const safeDescription = description.trim()
    
    // 验证 targetGrades 和 requiredSkills 是数组
    if (!Array.isArray(targetGrades) || !Array.isArray(requiredSkills)) {
      return {
        success: false,
        message: '面向年级和所需技能必须是数组格式'
      }
    }
    
    // 验证 deadline 是有效的日期
    const deadlineDate = new Date(deadline)
    if (isNaN(deadlineDate.getTime())) {
      return {
        success: false,
        message: '截止时间格式无效'
      }
    }
    
    // 构建活动数据
    const activityData = {
      _openid: openid,
      title: safeTitle,
      organizer: safeOrganizer,
      department: safeDepartment,
      targetGrades: targetGrades,
      deadline: deadlineDate,
      requiredSkills: requiredSkills,
      description: safeDescription,
      createdAt: new Date(),
      status: 'pending'
    }
    
    // 将活动数据存储到云端数据库
    const result = await db.collection('activities').add({
      data: activityData
    })
    
    console.log('活动信息存储成功，活动ID:', result._id)
    
    return {
      success: true,
      message: '活动信息存储成功',
      activityId: result._id
    }
  } catch (error) {
    console.error('活动信息存储失败:', error)
    return {
      success: false,
      message: '活动信息存储失败',
      error: error.message
    }
  }
}