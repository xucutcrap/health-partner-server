/**
 * 食物业务服务
 */
const categoryModel = require('./category-model')
const foodModel = require('./food-model')
const unitModel = require('./unit-model')
const axios = require('axios')

/**
 * 计算食物的营养信息（根据重量）
 */
async function calculateNutrition(foodId, weightGrams) {
  const food = await foodModel.findById(foodId)
  if (!food) {
    throw new Error('食物不存在')
  }

  const ratio = weightGrams / 100

  return {
    calories: Math.round(parseFloat(food.calories_per_100g) * ratio),
    protein: parseFloat((parseFloat(food.protein_per_100g || 0) * ratio).toFixed(2)),
    carbs: parseFloat((parseFloat(food.carbs_per_100g || 0) * ratio).toFixed(2)),
    fat: parseFloat((parseFloat(food.fat_per_100g || 0) * ratio).toFixed(2)),
    fiber: parseFloat((parseFloat(food.fiber_per_100g || 0) * ratio).toFixed(2))
  }
}

/**
 * 通过食物名称直接添加饮食记录
 */
async function addFoodRecordByName(openId, foodName, weightGrams, caloriePer100g = null) {
  if (!openId || !foodName || !weightGrams) {
    throw new Error('参数不完整')
  }

  // 插入饮食记录
  const today = new Date().toISOString().split('T')[0]
  let recordData = {
    open_id: openId,
    food_name: foodName,
    food_icon: '🍽️',
    meal_type: '', // 拍照识图不分类别
    record_date: today,
    custom_weight_grams: weightGrams,
    unit_id: null, // 不使用标准单位
    created_at: new Date(),
    updated_at: new Date()
  }

  // 先尝试通过名称搜索食物
  const foods = await foodModel.searchByName(foodName)

  if (foods && foods.length > 0) {
    // 找到匹配食物，使用数据库中的营养信息
    const food = foods[0]
    const nutrition = await calculateNutrition(food.id, weightGrams)

    recordData.food_id = food.id
    recordData.calories = nutrition.calories
    recordData.protein_grams = nutrition.protein
    recordData.carbs_grams = nutrition.carbs
    recordData.fat_grams = nutrition.fat
    recordData.fiber_grams = nutrition.fiber || 0

    if (food.icon) {
      recordData.food_icon = food.icon
    }
  } else {
    // 没有找到匹配食物，使用估算值
    let calories = 0
    let protein_grams = 0
    let carbs_grams = 0
    let fat_grams = 0
    let fiber_grams = 0

    if (caloriePer100g) {
      // 如果百度AI提供了calorie信息，使用它计算卡路里
      calories = Math.round((caloriePer100g * weightGrams) / 100)
      // 对于未收录食物，其他营养素暂时设置为0或保守估算
      protein_grams = 0
      carbs_grams = 0
      fat_grams = 0
      fiber_grams = 0
    }

    recordData.food_id = null // 未收录食物没有对应的food_id
    recordData.calories = calories
    recordData.protein_grams = protein_grams
    recordData.carbs_grams = carbs_grams
    recordData.fat_grams = fat_grams
    recordData.fiber_grams = fiber_grams
  }

  // 通过openId获取userId
  const userModel = require('../user/model')
  const user = await userModel.findByOpenId(openId)
  if (!user) {
    throw new Error('用户不存在')
  }

  // 插入饮食记录
  const dietModel = require('../user/diet-model')
  const result = await dietModel.create({
    userId: user.id,
    mealType: recordData.meal_type,
    foodName: recordData.food_name,
    calories: recordData.calories || 0,
    protein: recordData.protein_grams || 0,
    carbs: recordData.carbs_grams || 0,
    fat: recordData.fat_grams || 0,
    fiber: recordData.fiber_grams || 0,
    recordDate: recordData.record_date
  })

  return result
}


/**
 * 从图片Base64识别食物（对外接口）- 使用豆包大模型
 */
async function recognizeFoodFromBase64(imageBase64) {
  const config = require('../../../config')
  const apiKey = process.env.DOUBAO_API_KEY || config.doubao?.apiKey
  const baseUrl = process.env.DOUBAO_BASE_URL || config.doubao?.baseUrl
  const model = process.env.DOUBAO_MODEL || config.doubao?.model

  if (!apiKey || !baseUrl || !model) {
    console.error('豆包API配置不完整')
    return []
  }

  // 检查图片大小（限制10MB）
  if (imageBase64.length > 10 * 1024 * 1024) {
    console.error('图片过大')
    return []
  }

  try {
    // 构建提示词 - 简化版,减少AI处理时间
    const systemPrompt = `
        你是营养师和食品科学家。收到食物图片时，仅输出以下 JSON（无任何文本）：
        { 
          "foods": [
            {
              "icon": "emoji-食物图标",
              "name": "string-食物中文名称",
              "estimated_calories": number-卡路里,
              "estimated_carbs_g": number-碳水化合物克数,
              "estimated_fat_g": number-脂肪克数,
              "estimated_protein_g": number-蛋白质克数,
              "estimated_weight_g": number-食物重量克数
            }
          ]
        }
        规则：分析整份餐食，仅包含主要食物成分（不含调味品）。
    `;

    // 直接使用 HTTP 请求调用豆包 API
    // 根据Python示例，豆包使用自定义的 responses 接口
    const requestUrl = `${baseUrl}/responses`
    const requestData = {
      model: model,
      input: [
        {
          role: 'user',
          content: [
            {
              type: 'input_image',
              image_url: `data:image/jpeg;base64,${imageBase64}`
            },
            {
              type: 'input_text',
              text: systemPrompt
            }
          ]
        }
      ]
    }

    console.log('调用豆包API，URL:', requestUrl)
    console.log('请求数据大小:', JSON.stringify(requestData).length, 'bytes')
    console.log('图片base64长度:', imageBase64.length)
    console.log('开始请求时间:', new Date().toISOString())
    
    const startTime = Date.now()
    const response = await axios.post(requestUrl, requestData, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      timeout: 300000, // 增加到300秒（5分钟），图片识别需要更长时间
      // 增加连接和读取超时
      httpAgent: new (require('http').Agent)({ 
        keepAlive: true,
        timeout: 300000 
      }),
      httpsAgent: new (require('https').Agent)({ 
        keepAlive: true,
        timeout: 300000 
      })
    })
    
    const endTime = Date.now()
    console.log('请求完成时间:', new Date().toISOString())
    console.log('请求耗时:', (endTime - startTime) / 1000, '秒')

    // 解析响应
    const responseData = response.data

    // 直接从 output[1].content[0].text 获取JSON字符串
    let jsonText = responseData?.output?.[1]?.content?.[0]?.text

    const emptyRes = {
      food: [],
      totalNutrition: { totalCalories: 0, totalProtein: 0, totalCarbs: 0, totalFat: 0 }
    }

    // 直接解析JSON
    try {
      const data = JSON.parse(jsonText?.trim() || '')

       // 转换为统一格式
      const foods = data?.foods?.map(item => ({
        name: item.name,
        weight: item.estimated_weight_g,
        calorie: item.estimated_calories,
        protein: item.estimated_protein_g,
        carbs: item.estimated_carbs_g,
        fat: item.estimated_fat_g
      }));

      // 计算总营养（确保数据一致性，重新累加）
      const totalNutrition = foods.reduce((acc, food) => {
        acc.totalCalories += food.calorie;
        acc.totalProtein += food.protein;
        acc.totalCarbs += food.carbs;
        acc.totalFat += food.fat;
        return acc;
      }, { totalCalories: 0, totalProtein: 0, totalCarbs: 0, totalFat: 0 });

      // 保留一位小数
      totalNutrition.totalProtein = totalNutrition.totalProtein.toFixed(1);
      totalNutrition.totalCarbs = totalNutrition.totalCarbs.toFixed(1);
      totalNutrition.totalFat = totalNutrition.totalFat.toFixed(1);

      return {
        foods,
        totalNutrition
      }
    } catch (error) {
      console.error('解析JSON失败:', error)
      console.error('原始文本:', jsonText)
      return emptyRes
    }

  } catch (error) {
    console.error('调用豆包API失败:', error.message)
    if (error.response) {
      console.error('响应状态:', error.response.status)
      console.error('响应数据:', error.response.data)
    }
    return emptyRes
  }
}

/**
 * 分析单个食物的营养成分（使用豆包AI）
 * @param {string} foodName - 食物名称
 * @param {number} weight - 食物重量（克）
 * @returns {Promise<Object>} 营养成分数据
 */
async function analyzeFoodNutrition(foodName, weight) {
  const config = require('../../../config')
  const apiKey = process.env.DOUBAO_API_KEY || config.doubao?.apiKey
  const baseUrl = process.env.DOUBAO_BASE_URL || config.doubao?.baseUrl
  const model = process.env.DOUBAO_MODEL || config.doubao?.model

  if (!apiKey || !baseUrl || !model) {
    console.error('豆包API配置不完整')
    throw new Error('AI服务配置不完整')
  }

  try {
    // 构建提示词 - 简化版
    const prompt = `分析食物营养: ${foodName} ${weight}克。返回JSON: {"calories":数字,"protein":数字,"carbs":数字,"fat":数字,"fiber":数字}`

    // 调用豆包API
    const requestUrl = `${baseUrl}/responses`
    const requestData = {
      model: model,
      input: [
        {
          role: 'user',
          content: [
            {
              type: 'input_text',
              text: prompt
            }
          ]
        }
      ]
    }

    console.log('调用豆包API分析食物营养:', foodName, weight + 'g')
    
    const response = await axios.post(requestUrl, requestData, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      timeout: 30000
    })

    // 解析响应
    const responseData = response.data
    let jsonText = ''
    
    if (responseData.output && responseData.output[1] && responseData.output[1].content && responseData.output[1].content[0]) {
      jsonText = responseData.output[1].content[0].text || ''
    }

    if (!jsonText) {
      throw new Error('无法获取AI响应')
    }

    console.log('AI响应:', jsonText)

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

    // 解析JSON
    const data = JSON.parse(cleanJson)

    return {
      calories: Math.round(data.calories || 0),
      protein: parseFloat((data.protein || 0).toFixed(1)),
      carbs: parseFloat((data.carbs || 0).toFixed(1)),
      fat: parseFloat((data.fat || 0).toFixed(1)),
      fiber: parseFloat((data.fiber || 0).toFixed(1))
    }

  } catch (error) {
    console.error('分析食物营养失败:', error.message)
    if (error.response) {
      console.error('响应状态:', error.response.status)
      console.error('响应数据:', error.response.data)
    }
    
    // 返回估算值（基于常见食物的平均值）
    // 这里可以根据食物名称做简单的分类估算
    const estimatedCaloriesPer100g = 150 // 平均值
    const ratio = weight / 100
    
    return {
      calories: Math.round(estimatedCaloriesPer100g * ratio),
      protein: parseFloat((5 * ratio).toFixed(1)),
      carbs: parseFloat((20 * ratio).toFixed(1)),
      fat: parseFloat((5 * ratio).toFixed(1)),
      fiber: parseFloat((2 * ratio).toFixed(1))
    }
  }
}

/**
 * 从文本识别食物
 * @param {string} text - 用户输入的文本描述
 * @returns {Promise<Object>} 识别结果
 */
async function recognizeFoodFromText(text) {
  const config = require('../../../config')
  try {
    // 构建提示词
    const systemPrompt = `
        你是营养师和食品科学家。用户用一句话描述餐食，你需识别所有食物并估算营养，仅输出以下 JSON（无任何文本）：
        { 
          "foods": [
            {
              "icon": "emoji-食物图标",
              "name": "string-食物中文名称",
              "estimated_calories": number-卡路里,
              "estimated_carbs_g": number-碳水化合物克数,
              "estimated_fat_g": number-脂肪克数,
              "estimated_protein_g": number-蛋白质克数,
              "estimated_weight_g": number-食物重量克数
            }
          ]
        }
        规则：分析整份餐食，仅包含主要食物成分（不含调味品）。
    `;

    const userPrompt = `用户描述：${text}`;

    // 调用豆包AI
    const response = await axios.post(
      `${config.doubao.baseUrl}/chat/completions`,
      {
        model: config.doubao.model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.7
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${config.doubao.apiKey}`
        },
        timeout: 120000
      }
    );

    console.log('response', response.data.choices[0].message)

    const content = response.data.choices[0].message.content;
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    
    if (!jsonMatch) {
      throw new Error('AI返回格式错误');
    }

    const data = JSON.parse(jsonMatch[0]);

    console.log('data', data)

    // 转换为统一格式
    const foods = data?.foods?.map(item => ({
      name: item.name,
      weight: item.estimated_weight_g,
      calorie: item.estimated_calories,
      protein: item.estimated_protein_g,
      carbs: item.estimated_carbs_g,
      fat: item.estimated_fat_g
    }));

    // 计算总营养（确保数据一致性，重新累加）
    const totalNutrition = foods.reduce((acc, food) => {
      acc.totalCalories += food.calorie;
      acc.totalProtein += food.protein;
      acc.totalCarbs += food.carbs;
      acc.totalFat += food.fat;
      return acc;
    }, { totalCalories: 0, totalProtein: 0, totalCarbs: 0, totalFat: 0 });

    // 保留一位小数
    totalNutrition.totalProtein = totalNutrition.totalProtein.toFixed(1);
    totalNutrition.totalCarbs = totalNutrition.totalCarbs.toFixed(1);
    totalNutrition.totalFat = totalNutrition.totalFat.toFixed(1);

    return {
      code: 0,
      message: 'success',
      data: {
        foods,
        totalNutrition
      }
    };
  } catch (error) {
    console.error('文本识别失败:', error);
    return {
      code: 500,
      message: '识别失败: ' + error.message,
      data: null
    };
  }
}

module.exports = {
  calculateNutrition,
  recognizeFoodFromBase64,
  addFoodRecordByName,
  analyzeFoodNutrition,
  recognizeFoodFromText
}
