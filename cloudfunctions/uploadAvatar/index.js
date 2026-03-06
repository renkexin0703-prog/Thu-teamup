const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV }) // 自动适配当前环境

exports.main = async (event, context) => {
  try {
    const { fileContent, cloudPath } = event
    // 上传到云存储
    const res = await cloud.uploadFile({
      cloudPath: cloudPath, // 比如'avatars/xxx.jpg'
      fileContent: Buffer.from(fileContent, 'base64') // 接收base64文件
    })
    return { success: true, fileID: res.fileID }
  } catch (err) {
    console.error(err)
    return { success: false, errMsg: err.message }
  }
}