const cloud = require('wx-server-sdk')
const axios = require('axios')
const cheerio = require('cheerio')
// 这里的 ID 必须和你控制台顶部看到的一模一样
cloud.init({ env: 'cloud1-6g67sh8587f55b79' })

exports.main = async (event, context) => {
  const { url } = event
  if (!url) return { success: false, msg: '链接为空' }

  try {
    const res = await axios.get(url, {
      timeout: 8000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1'
      }
    })

    const html = res.data
    const $ = cheerio.load(html)

    // 1. 尝试多种方式抓取标题
    let title = $('#activity-name').text().trim() 
               || $('meta[property="og:title"]').attr('content') 
               || "（未能识别标题，请手动输入）"

    // 2. 尝试抓取正文文字
    let content = $('#js_content').text().trim().replace(/\s+/g, ' ')
    
    // 如果是纯图片/视频，给个提示
    if (!content || content.length < 5) {
      content = "检测到该推文可能为纯图片或视频，请手动补充简介。"
    }

    // 3. 提取日期
    const dateRegex = /(\d{4}[-/年]\d{1,2}[-/月]\d{1,2})|(\d{1,2}月\d{1,2}日)/
    const match = html.match(dateRegex) // 在全网页匹配日期更准
    let deadline = ""
    if (match) {
      deadline = match[0].replace(/[年月]/g, '-').replace('日', '')
      if (deadline.split('-').length === 2) deadline = `${new Date().getFullYear()}-${deadline}`
    }

    return {
      success: true,
      data: {
        title,
        content: content.substring(0, 100),
        deadline,
        sourceUrl: url,
        department: "清华大学"
      }
    }
  } catch (err) {
    // 关键：把具体的错误原因发给前端
    return { 
      success: false, 
      msg: '解析出错了：' + err.message 
    }
  }
}