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
    // 构建提示词 - 简化版
    const systemPrompt = "你是一名专业的健身教练。用户会用一句话描述他的运动情况，你需要识别出运动类型、时长（分钟）和估算的卡路里消耗。输出必须是纯净的JSON对象，格式：{\"exercise_name\": \"标准运动名称(如：跑步、游泳、骑行等)\", \"duration_minutes\": 数字, \"calories\": 数字, \"intensity\": \"低/中/高\", \"notes\": \"简短建议\"}。如果用户没有提供时长，请根据经验估算一个合理值（如30分钟）。无需任何其他文字。"

    console.log('Calling Doubao API for exercise:', text)

    // 调用豆包API - 使用正确的/responses端点
    const requestUrl = `${baseUrl}/responses`
    const requestData = {
      model: model,
      input: [
        {
          role: 'user',
          content: [
            {
              type: 'input_text',
              text: `${systemPrompt}\n\n用户描述：${text}`
            }
          ]
        }
      ]
    }

    const response = await axios.post(requestUrl, requestData, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      timeout: 60000, // 60秒超时
      // 增加连接和读取超时,防止ECONNRESET
      httpAgent: new (require('http').Agent)({ 
        keepAlive: true,
        timeout: 60000 
      }),
      httpsAgent: new (require('https').Agent)({ 
        keepAlive: true,
        timeout: 60000 
      })
    })

    // 解析响应 - 使用与食物识别相同的格式
    const responseData = response.data
    let jsonText = ''
    
    if (responseData.output && responseData.output[1] && responseData.output[1].content && responseData.output[1].content[0]) {
      jsonText = responseData.output[1].content[0].text || ''
    }

    if (!jsonText) {
      throw new Error('无法获取AI响应')
    }

    console.log('Doubao Response:', jsonText)

    // 提取JSON（可能包含在markdown代码块中）
    let cleanJson = jsonText.trim()
    const jsonMatch = jsonText.match(/```(?:json)?\s*([\s\S]*?)\s*```/)
    if (jsonMatch) {
      cleanJson = jsonMatch[1]
    } else {
      // 尝试提取第一个{到最后一个}之间的内容
      const braceMatch = jsonText.match(/\{[\s\S]*\}/)
      if (braceMatch) {
        cleanJson = braceMatch[0]
      }
    }

    const aiResult = JSON.parse(cleanJson)

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
