// cloudfunctions/askAI/index.js
const cloud = require('wx-server-sdk');
const rp = require('request-promise');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

exports.main = async (event, context) => {
  console.log('=== 开始执行 askAI 函数 ===');
  console.log('入参:', event);

  const { prompt, messages, userContext } = event;
  if (!prompt) {
    return { success: false, message: '请输入提问内容' };
  }

  try {
    // 🔥 核心改动：欢迎语直接返回固定内容，不调用AI
    if (prompt === '发送个性化欢迎语') {
      const fixedWelcomeMsg = `
你好，我是Deepseek-Teamup智能体，很高兴见到你！
我可以帮你解答清华校园活动、组队相关的各种问题，比如：
1. 最近有什么适合我的校园活动？
2. 帮我找软件设计大赛的组队帖；
3. 计算机系有哪些特色组队活动？
有任何想了解的，都可以尽管问～
      `.trim();

      return { success: true, response: fixedWelcomeMsg };
    }

    // ========== 以下是原有正常提问的AI调用逻辑 ==========
    console.log('开始调用 DeepSeek API');

    // 🔥 核心改动1：同时获取组队帖 + 活动帖（平级处理）
    const db = cloud.database();
    // 原有：获取组队帖
    const allTeamPostsRes = await db.collection('teamUpPosts').limit(20).get();
    const allTeamPosts = allTeamPostsRes.data;
    // 新增：获取活动帖（和组队帖完全平级）
    const allActivitiesRes = await db.collection('activities').limit(20).get();
    const allActivities = allActivitiesRes.data;

    // 🔥 核心改动2：上下文新增活动帖模块（严格匹配你的真实字段）
    const fullContext = `
${userContext}

### 所有组队帖
${allTeamPosts.map(post => {
      const postSkills = Array.isArray(post.skills) ? post.skills : [];
      return `- 标题：${post.title || '无'}\n  发布人：${post.userName || '未知'}\n  院系：${post.userDepartment || '未知'}\n  技能要求：${postSkills.join(', ') || '暂无'}\n  状态：${post.isActive ? '活跃中' : '已下架'}`;
    }).join('\n')}

### 所有活动帖
${allActivities.map(activity => {
      // 严格适配你数据库的真实字段：title、organizer、department、teamCount、deadline、status
      return `- 标题：${activity.title || '无'}\n  主办方：${activity.organizer || '未知'}\n  所属院系：${activity.department || '未知'}\n  队伍数量：${activity.teamCount || 0}支\n  截止时间：${activity.deadline || '无'}\n  状态：${activity.status || '未知'}`;
    }).join('\n')}
    `.trim();

    // 正常对话Prompt
    const systemContent = `
你是一个专业的清华校园组队/活动推荐智能助手，需遵守以下规则：
0.长度限制：最多300字.分点不超过2条，每条一句话；
1. 基础信息优先：必须以【用户上下文】中的信息为核心（用户信息、组队帖、活动帖、院系介绍、小程序规则）；
2. 智能推理要求：
   - 可基于用户的院系、技能，结合已发布的组队帖和活动帖，推导适合的参与方向；
3. 信息边界：如果上下文没有相关基础信息（如未提及某活动），不要编造，但可基于通用校园常识补充合理建议；
4. 回答风格：自然流畅，像真人沟通，分点清晰（必要时），避免机械生硬。
5.社区页面没有搜索功能，也没有技能筛选，你可以推荐“重点关注院系”。

【用户上下文】
${fullContext}
    `.trim();

    // 构建对话历史
    const chatHistory = [];
    if (messages && messages.length > 0) {
      messages.forEach(msg => {
        chatHistory.push({
          role: msg.role,
          content: msg.content
        });
      });
    }

    // 调用参数
    const options = {
      method: 'POST',
      url: 'https://api.deepseek.com/v1/chat/completions',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY}`
      },
      body: {
        model: 'deepseek-chat',
        messages: [
          { role: 'system', content: systemContent },
          ...chatHistory,
          { role: 'user', content: prompt }
        ],
        temperature: 0.3,
        max_tokens: 256,
        top_p: 0.5,
        presence_penalty: 0.1,
        frequency_penalty: 0.1
      },
      json: true
    };

    console.log('DeepSeek 调用参数:', JSON.stringify(options.body, null, 2));
    const res = await rp(options);
    console.log('DeepSeek 返回:', res);

    const aiReply = res.choices[0].message.content;
    return { success: true, response: aiReply };

  } catch (err) {
    console.error('DeepSeek 调用失败:', err);
    return {
      success: false,
      message: err.message || '调用AI失败，请稍后重试',
      detail: err.response ? err.response.body : ''
    };
  }
};