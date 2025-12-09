const axios = require('axios')
const config = require('../../../config')

/**
 * 从文本识别运动
 * @param {string} text - 用户输入的文本描述
 * @returns {Promise<Object>} 识别结果
 */
async function recognizeExerciseFromText(text) {
  const config = require('../../../config')
  // 安全获取配置
  const apiKey = process.env.DOUBAO_API_KEY || config.doubao?.apiKey
  const baseUrl = process.env.DOUBAO_BASE_URL || config.doubao?.baseUrl
  const model = process.env.DOUBAO_MODEL || config.doubao?.model

  console.log('Exercise AI Config Check:', { 
    hasKey: !!apiKey, 
    baseUrl, 
    model 
  })

  if (!apiKey || !baseUrl || !model) {
    console.error('豆包API配置不完整')
    return {
      code: 500,
      message: 'AI服务配置缺失',
      data: null
    }
  }

  try {
    // 构建提示词
    const systemPrompt = "你是一名专业的健身教练。用户会用一句话描述他的运动情况，你需要识别出运动类型、时长（分钟）和估算的卡路里消耗。输出必须是纯净的JSON对象，格式：{\"exercise_name\": \"标准运动名称(如：跑步、游泳、骑行等)\", \"duration_minutes\": 数字, \"calories\": 数字, \"intensity\": \"低/中/高\", \"notes\": \"简短建议\"}。如果用户没有提供时长，请根据经验估算一个合理值（如30分钟）。无需任何其他文字。"

    const userPrompt = `用户描述：${text}`

    console.log('Calling Doubao API for exercise:', text)

    // 调用豆包AI
    const response = await axios.post(
      `${baseUrl}/chat/completions`,
      {
        model: model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.7
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        timeout: 60000 // 60秒超时
      }
    )

    const content = response.data.choices[0].message.content
    console.log('Doubao Response:', content)

    // 尝试提取JSON
    const jsonMatch = content.match(/\{[\s\S]*\}/)
    
    if (!jsonMatch) {
      throw new Error('AI返回格式错误')
    }

    const aiResult = JSON.parse(jsonMatch[0])

    return {
      code: 0,
      message: 'success',
      data: aiResult
    }
  } catch (error) {
    console.error('运动文本识别失败:', error.message)
    if (error.response) {
      console.error('API Error Response:', error.response.data)
    }
    return {
      code: 500,
      message: '识别失败: ' + error.message,
      data: null
    }
  }
}

module.exports = {
  recognizeExerciseFromText
}
