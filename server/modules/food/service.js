/**
 * 食物业务服务
 */
const categoryModel = require('./category-model')
const foodModel = require('./food-model')
const unitModel = require('./unit-model')
const axios = require('axios')

/**
 * 获取所有食物分类
 */
async function getCategories() {
  const categories = await categoryModel.findAll()
  return categories.map(cat => ({
    id: cat.id,
    name: cat.name,
    icon: cat.icon || null,
    sortOrder: cat.sort_order
  }))
}

/**
 * 根据分类ID获取食物列表
 */
async function getFoodsByCategory(categoryId) {
  if (!categoryId) {
    return []
  }

  const foods = await foodModel.findByCategoryId(categoryId)
  return foods.map(food => ({
    id: food.id,
    categoryId: food.category_id,
    name: food.name,
    icon: food.icon || null,
    caloriesPer100g: parseFloat(food.calories_per_100g),
    proteinPer100g: parseFloat(food.protein_per_100g || 0),
    carbsPer100g: parseFloat(food.carbs_per_100g || 0),
    fatPer100g: parseFloat(food.fat_per_100g || 0),
    fiberPer100g: parseFloat(food.fiber_per_100g || 0),
    sortOrder: food.sort_order
  }))
}

/**
 * 搜索食物
 */
async function searchFoods(keyword) {
  if (!keyword || keyword.trim() === '') {
    return []
  }

  const foods = await foodModel.searchByName(keyword.trim())
  return foods.map(food => ({
    id: food.id,
    categoryId: food.category_id,
    name: food.name,
    icon: food.icon || null,
    caloriesPer100g: parseFloat(food.calories_per_100g),
    proteinPer100g: parseFloat(food.protein_per_100g || 0),
    carbsPer100g: parseFloat(food.carbs_per_100g || 0),
    fatPer100g: parseFloat(food.fat_per_100g || 0),
    fiberPer100g: parseFloat(food.fiber_per_100g || 0),
    sortOrder: food.sort_order
  }))
}

/**
 * 根据食物ID获取单位列表
 */
async function getUnitsByFood(foodId) {
  if (!foodId) {
    return []
  }

  const units = await unitModel.findByFoodId(foodId)
  return units.map(unit => ({
    id: unit.id,
    foodId: unit.food_id,
    unitName: unit.unit_name,
    weightGrams: parseFloat(unit.weight_grams),
    sortOrder: unit.sort_order
  }))
}

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
 * 通过食物名称直接添加饮食记录（拍照识图专用）
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
 * 获取百度API访问令牌
 */
async function getBaiduAccessToken(apiKey, secretKey) {
  try {
    const tokenUrl = "https://aip.baidubce.com/oauth/2.0/token"
    const params = {
      grant_type: "client_credentials",
      client_id: apiKey,
      client_secret: secretKey
    }

    const response = await axios.post(tokenUrl, null, { params, timeout: 10000 })
    if (response.status === 200) {
      const result = response.data
      return result.access_token || ""
    }
    return ""
  } catch (error) {
    console.error('获取百度token失败:', error.message)
    return ""
  }
}

/**
 * 从图片URL识别食物
 */
async function recognizeFoodFromUrl(imageUrl, accessToken) {
  try {
    // 下载图片数据
    const response = await axios.get(imageUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      },
      timeout: 30000,
      responseType: 'arraybuffer'
    })

    if (response.status !== 200) {
      return { result: [] }
    }

    // 检查内容类型，确保是图片
    const contentType = response.headers['content-type'] || ''
    if (!contentType.startsWith('image/')) {
      return { result: [] }
    }

    // 将图片转换为base64
    const imageData = Buffer.from(response.data, 'binary')
    const imageBase64 = imageData.toString('base64')

    // 检查图片大小（百度API限制4MB）
    if (imageBase64.length > 4 * 1024 * 1024) {
      return { result: [] }
    }

    // 调用百度菜品识别API
    return await callBaiduFoodApi(imageBase64, accessToken)

  } catch (error) {
    console.error('图片处理失败:', error.message)
    return { result: [] }
  }
}

/**
 * 调用百度菜品识别API
 */
async function callBaiduFoodApi(imageBase64, accessToken) {
  try {
    const requestUrl = `https://aip.baidubce.com/rest/2.0/image-classify/v2/dish?access_token=${accessToken}`

    const params = {
      image: imageBase64,
      top_num: 10,  // 返回前10个识别结果
      filter_threshold: 0.7  // 置信度阈值
    }

    const headers = { 'content-type': 'application/x-www-form-urlencoded' }
    const response = await axios.post(requestUrl, params, { headers, timeout: 10000 })

    if (response.status === 200) {
      const result = response.data

      // 检查百度API返回的错误
      if (result.error_code) {
        return { result: [] }
      }

      return result
    } else {
      return { result: [] }
    }

  } catch (error) {
    console.error('调用百度API失败:', error.message)
    return { result: [] }
  }
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
    const systemPrompt = "你是一名专业的营养师和食品科学家，擅长通过图像精确识别食物并分析其营养成分。核心指令：当我发送食物图片时，你必须直接输出一个纯净、无额外解释的JSON对象。基于图片，分析整份餐食：1.生成一个描述性meal_name。2.在overview中估算整餐的总热量、总蛋白质、总碳水化合物和总脂肪。3.给出一个基于营养均衡与食材质量的1-10分health_score。4.在ingredients列表中，为每种主要食物成分（非调味品）提供图标、名称、预估热量和克数。输出必须严格遵循此JSON格式：{\"meal_name\": \"中文字符串\", \"overview\": {\"estimated_total_calories\": 数字, \"total_protein_g\": 数字, \"total_carbs_g\": 数字, \"total_fat_g\": 数字}, \"health_score\": 数字, \"ingredients\": [{\"icon\": \"表情符号\", \"name\": \"字符串\", \"calories\": 数字, \"estimated_weight_g\": 数字}]}。无需任何其他文本。"

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
    let jsonText = ''
    if (responseData.output && responseData.output[1] && responseData.output[1].content && responseData.output[1].content[0]) {
      jsonText = responseData.output[1].content[0].text || ''
    }

    if (!jsonText) {
      console.error('无法获取响应内容')
      return {
        foods: [],
        totalNutrition: { totalCalories: 0, totalProtein: 0, totalFat: 0, totalCarbs: 0 },
        healthScore: 0,
        mealName: '未识别'
      }
    }

    console.log('解析的JSON文本:', jsonText)

    // 直接解析JSON
    try {
      const data = JSON.parse(jsonText.trim())

      // 转换为前端需要的格式
      const foods = (data.ingredients || []).map(ingredient => ({
        icon: ingredient.icon || '🍽️',
        name: ingredient.name || '未知食物',
        calorie: ingredient.calories || 0,
        weight: ingredient.estimated_weight_g || 0,
        protein: 0, // JSON中没有单独提供，需要根据总营养分配
        carbs: 0,
        fat: 0
      }))

      // 根据总营养和成分数量，按卡路里比例分配营养值
      const ingredientCount = foods.length
      if (ingredientCount > 0 && data.overview) {
        foods.forEach(food => {
          // 根据卡路里比例分配营养
          const calorieRatio = data.overview.estimated_total_calories > 0 
            ? food.calorie / data.overview.estimated_total_calories 
            : 1 / ingredientCount
          food.protein = Math.round((data.overview.total_protein_g || 0) * calorieRatio * 10) / 10
          food.carbs = Math.round((data.overview.total_carbs_g || 0) * calorieRatio * 10) / 10
          food.fat = Math.round((data.overview.total_fat_g || 0) * calorieRatio * 10) / 10
        })
      }

      return {
        foods: foods,
        totalNutrition: {
          totalCalories: data.overview?.estimated_total_calories || 0,
          totalProtein: data.overview?.total_protein_g || 0,
          totalFat: data.overview?.total_fat_g || 0,
          totalCarbs: data.overview?.total_carbs_g || 0
        },
        healthScore: data.health_score || 5,
        mealName: data.meal_name || '识别结果'
      }
    } catch (error) {
      console.error('解析JSON失败:', error)
      console.error('原始文本:', jsonText)
      return {
        foods: [],
        totalNutrition: { totalCalories: 0, totalProtein: 0, totalFat: 0, totalCarbs: 0 },
        healthScore: 5,
        mealName: '解析失败'
      }
    }

  } catch (error) {
    console.error('调用豆包API失败:', error.message)
    if (error.response) {
      console.error('响应状态:', error.response.status)
      console.error('响应数据:', error.response.data)
    }
    return {
      foods: [],
      totalNutrition: { totalCalories: 0, totalProtein: 0, totalFat: 0, totalCarbs: 0 },
      healthScore: 5,
      mealName: '识别失败'
    }
  }
}

/**
 * 解析豆包返回的JSON格式分析结果
 */
function parseDoubaoJSON(analysisText) {
  if (!analysisText) {
    return {
      foods: [],
      totalNutrition: { totalCalories: 0, totalProtein: 0, totalFat: 0, totalCarbs: 0 },
      healthScore: 5,
      mealName: '未识别'
    }
  }

  try {
    // 尝试提取JSON部分（可能包含在markdown代码块中）
    let jsonText = analysisText
    
    // 如果包含```json或```，提取JSON部分
    const jsonMatch = analysisText.match(/```(?:json)?\s*([\s\S]*?)\s*```/)
    if (jsonMatch) {
      jsonText = jsonMatch[1]
    } else {
      // 尝试提取第一个{到最后一个}之间的内容
      const braceMatch = analysisText.match(/\{[\s\S]*\}/)
      if (braceMatch) {
        jsonText = braceMatch[0]
      }
    }

    const data = JSON.parse(jsonText.trim())

    // 转换为前端需要的格式
    const foods = (data.ingredients || []).map(ingredient => ({
      icon: ingredient.icon || '🍽️',
      name: ingredient.name || '未知食物',
      calorie: ingredient.calories || 0,
      weight: ingredient.estimated_weight_g || 0,
      protein: 0, // JSON中没有单独提供，需要根据总营养分配
      carbs: 0,
      fat: 0
    }))

    // 根据总营养和成分数量，平均分配营养值（简单处理）
    const ingredientCount = foods.length
    if (ingredientCount > 0 && data.overview) {
      foods.forEach(food => {
        // 根据卡路里比例分配营养
        const calorieRatio = data.overview.estimated_total_calories > 0 
          ? food.calorie / data.overview.estimated_total_calories 
          : 1 / ingredientCount
        food.protein = Math.round((data.overview.total_protein_g || 0) * calorieRatio * 10) / 10
        food.carbs = Math.round((data.overview.total_carbs_g || 0) * calorieRatio * 10) / 10
        food.fat = Math.round((data.overview.total_fat_g || 0) * calorieRatio * 10) / 10
      })
    }

    return {
      foods: foods,
      totalNutrition: {
        totalCalories: data.overview?.estimated_total_calories || 0,
        totalProtein: data.overview?.total_protein_g || 0,
        totalFat: data.overview?.total_fat_g || 0,
        totalCarbs: data.overview?.total_carbs_g || 0
      },
      healthScore: data.health_score || 5,
      mealName: data.meal_name || '识别结果'
    }
  } catch (error) {
    console.error('解析JSON失败:', error)
    console.error('原始文本:', analysisText)
    // 如果JSON解析失败，返回空结果
    return {
      foods: [],
      totalNutrition: { totalCalories: 0, totalProtein: 0, totalFat: 0, totalCarbs: 0 },
      healthScore: 5,
      mealName: '解析失败'
    }
  }
}

/**
 * 解析豆包返回的分析文本，提取食物识别结果（旧版本，保留备用）
 */
function parseDoubaoAnalysis(analysisText) {
  if (!analysisText) {
    return []
  }

  const foods = []
  
  // 提取食物识别结果部分
  const recognitionMatch = analysisText.match(/### 食物识别结果[\s\S]*?(?=###|$)/)
  if (!recognitionMatch) {
    return []
  }

  const recognitionText = recognitionMatch[0]
  
  // 匹配食物名称和置信度
  const foodPattern = /- (.+?) 【(高|中|低)】/g
  let match

  while ((match = foodPattern.exec(recognitionText)) !== null) {
    const foodName = match[1].trim()
    const confidence = match[2]

    // 处理多个可能性（用 / 分隔）
    const possibilities = foodName.split('/').map(p => p.trim())
    
    possibilities.forEach((name, index) => {
      // 计算置信度分数
      let probability = 0.7
      if (confidence === '高') {
        probability = 0.9 - (index * 0.1) // 第一个选项0.9，第二个0.8，以此类推
      } else if (confidence === '中') {
        probability = 0.6 - (index * 0.1)
      } else {
        probability = 0.4 - (index * 0.1)
      }

      // 提取营养成分（从表格中）
      const nutrition = extractNutritionFromTable(analysisText, name)

      foods.push({
        name: name,
        probability: Math.max(0.1, probability),
        calorie: nutrition.calorie || null,
        weight: nutrition.weight || null,
        protein: nutrition.protein || null,
        carbs: nutrition.carbs || null,
        fat: nutrition.fat || null
      })
    })
  }

  // 如果没有匹配到，尝试从营养成分表格中提取
  if (foods.length === 0) {
    const tableMatch = analysisText.match(/### 营养成分估算[\s\S]*?(?=###|$)/)
    if (tableMatch) {
      const tableText = tableMatch[0]
      // 匹配完整表格：| 食物选项 | 估算重量(g) | 热量(kcal) | 蛋白质(g) | 脂肪(g) | 碳水(g) |
      const rowPattern = /\| (.+?) \| (\d+) \| (\d+) \| ([\d.]+) \| ([\d.]+) \| ([\d.]+) \|/g
      let rowMatch
      while ((rowMatch = rowPattern.exec(tableText)) !== null) {
        const name = rowMatch[1].trim()
        const weight = parseInt(rowMatch[2])
        const calorie = parseInt(rowMatch[3])
        const protein = parseFloat(rowMatch[4])
        const fat = parseFloat(rowMatch[5])
        const carbs = parseFloat(rowMatch[6])
        
        foods.push({
          name: name,
          probability: 0.7,
          calorie: calorie,
          weight: weight,
          protein: protein,
          fat: fat,
          carbs: carbs
        })
      }
      
      // 如果完整格式匹配失败，尝试简单格式
      if (foods.length === 0) {
        const simplePattern = /\| (.+?) \| (\d+) \| (\d+) \|/g
        let simpleMatch
        while ((simpleMatch = simplePattern.exec(tableText)) !== null) {
          const name = simpleMatch[1].trim()
          const weight = parseInt(simpleMatch[2])
          const calorie = parseInt(simpleMatch[3])
          
          foods.push({
            name: name,
            probability: 0.7,
            calorie: calorie,
            weight: weight,
            protein: null,
            fat: null,
            carbs: null
          })
        }
      }
    }
  }

  // 去重并排序（按置信度降序）
  const uniqueFoods = []
  const seen = new Set()
  
  foods.forEach(food => {
    if (!seen.has(food.name)) {
      seen.add(food.name)
      uniqueFoods.push(food)
    }
  })

  // 提取总览信息（总营养汇总）
  const summaryMatch = analysisText.match(/总营养汇总[\s\S]*?总热量：\s*~?(\d+)\s*kcal[\s\S]*?总蛋白质：\s*~?([\d.]+)\s*g[\s\S]*?总脂肪：\s*~?([\d.]+)\s*g[\s\S]*?总碳水化合物：\s*~?([\d.]+)\s*g/i)
  let totalNutrition = null
  if (summaryMatch) {
    totalNutrition = {
      totalCalories: parseInt(summaryMatch[1]) || 0,
      totalProtein: parseFloat(summaryMatch[2]) || 0,
      totalFat: parseFloat(summaryMatch[3]) || 0,
      totalCarbs: parseFloat(summaryMatch[4]) || 0
    }
  }

  // 计算健康评分（简单算法：基于营养均衡度）
  let healthScore = 70 // 默认70分
  if (totalNutrition) {
    const { totalCalories, totalProtein, totalFat, totalCarbs } = totalNutrition
    // 基础评分：卡路里合理性（假设正常一餐400-600卡）
    if (totalCalories >= 300 && totalCalories <= 800) {
      healthScore += 10
    } else if (totalCalories < 300 || totalCalories > 1000) {
      healthScore -= 10
    }
    // 蛋白质比例（理想15-25%）
    const proteinRatio = totalCalories > 0 ? (totalProtein * 4 / totalCalories) * 100 : 0
    if (proteinRatio >= 15 && proteinRatio <= 25) {
      healthScore += 10
    }
    // 脂肪比例（理想20-35%）
    const fatRatio = totalCalories > 0 ? (totalFat * 9 / totalCalories) * 100 : 0
    if (fatRatio >= 20 && fatRatio <= 35) {
      healthScore += 10
    }
    healthScore = Math.max(0, Math.min(100, healthScore))
  }

  const result = {
    foods: uniqueFoods
      .sort((a, b) => b.probability - a.probability)
      .slice(0, 10)
      .map(item => ({
        name: item.name,
        probability: (item.probability * 100).toFixed(2) + '%',
        calorie: item.calorie,
        weight: item.weight || 100, // 默认100g
        protein: item.protein || 0,
        carbs: item.carbs || 0,
        fat: item.fat || 0,
        icon: '🍽️' // 默认图标
      })),
    totalNutrition: totalNutrition || {
      totalCalories: uniqueFoods.reduce((sum, f) => sum + (f.calorie || 0), 0),
      totalProtein: uniqueFoods.reduce((sum, f) => sum + (f.protein || 0), 0),
      totalFat: uniqueFoods.reduce((sum, f) => sum + (f.fat || 0), 0),
      totalCarbs: uniqueFoods.reduce((sum, f) => sum + (f.carbs || 0), 0)
    },
    healthScore: healthScore
  }

  return result
}

/**
 * 从分析文本的表格中提取营养成分
 */
function extractNutritionFromTable(analysisText, foodName) {
  const tableMatch = analysisText.match(/### 营养成分估算[\s\S]*?(?=###|$)/)
  if (!tableMatch) {
    return { calorie: null, weight: null, protein: null, carbs: null, fat: null }
  }

  const tableText = tableMatch[0]
  const rows = tableText.split('\n').filter(row => row.includes('|') && !row.includes('---'))

  for (const row of rows) {
    if (row.includes(foodName)) {
      const cells = row.split('|').map(cell => cell.trim()).filter(cell => cell)
      // 表格格式：| 食物选项 | 估算重量(g) | 热量(kcal) | 蛋白质(g) | 脂肪(g) | 碳水(g) |
      if (cells.length >= 6) {
        return {
          weight: parseInt(cells[1]) || null,
          calorie: parseInt(cells[2]) || null,
          protein: parseFloat(cells[3]) || null,
          fat: parseFloat(cells[4]) || null,
          carbs: parseFloat(cells[5]) || null
        }
      } else if (cells.length >= 3) {
        // 兼容旧格式（只有重量和热量）
        return {
          weight: parseInt(cells[1]) || null,
          calorie: parseInt(cells[2]) || null,
          protein: null,
          fat: null,
          carbs: null
        }
      }
    }
  }

  return { calorie: null, weight: null, protein: null, carbs: null, fat: null }
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
 * 从图片URL识别食物（对外接口，保持向后兼容）
 */
async function recognizeFoodFromImage(imageUrl) {
  // 从环境变量或配置读取百度API密钥
  const config = require('../../../config')
  const apiKey = process.env.BAIDU_API_KEY || config.baidu?.apiKey || "KqJWAyhGb5tEO0z0F06JRWMx"
  const secretKey = process.env.BAIDU_SECRET_KEY || config.baidu?.secretKey || "IwXv8s4PczJYgra8ftNDtKfUaIm904Ye"

  // 获取access_token
  const accessToken = await getBaiduAccessToken(apiKey, secretKey)

  if (!accessToken) {
    return { result: [] }
  }

  // 调用百度菜品识别API
  const recognitionResult = await recognizeFoodFromUrl(imageUrl, accessToken)

  // 只返回result数组，如果没有识别结果则返回空数组，取前6个
  const resultArray = recognitionResult.result || []
  return resultArray.slice(0, 6)
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
    const systemPrompt = "你是一名专业的营养师。用户会用一句话描述他吃了什么食物，你需要识别出所有食物并分析营养成分。输出必须是纯净的JSON对象，格式：{\"meal_name\": \"中文描述\", \"overview\": {\"estimated_total_calories\": 数字, \"total_protein_g\": 数字, \"total_carbs_g\": 数字, \"total_fat_g\": 数字}, \"health_score\": 数字(1-10), \"ingredients\": [{\"icon\": \"表情符号\", \"name\": \"食物名称\", \"calories\": 数字, \"estimated_weight_g\": 数字, \"protein_g\": 数字, \"fat_g\": 数字, \"carbs_g\": 数字}]}。无需任何其他文字。";

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

    const content = response.data.choices[0].message.content;
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    
    if (!jsonMatch) {
      throw new Error('AI返回格式错误');
    }

    const aiResult = JSON.parse(jsonMatch[0]);

    // 转换为统一格式
    const foods = aiResult.ingredients.map(ingredient => ({
      name: ingredient.name,
      weight: ingredient.estimated_weight_g || 100,
      calorie: ingredient.calories || 0,
      protein: ingredient.protein_g || 0,
      carbs: ingredient.carbs_g || 0,
      fat: ingredient.fat_g || 0
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
    totalNutrition.totalProtein = parseFloat(totalNutrition.totalProtein.toFixed(1));
    totalNutrition.totalCarbs = parseFloat(totalNutrition.totalCarbs.toFixed(1));
    totalNutrition.totalFat = parseFloat(totalNutrition.totalFat.toFixed(1));

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
  getCategories,
  getFoodsByCategory,
  searchFoods,
  getUnitsByFood,
  calculateNutrition,
  recognizeFoodFromImage,
  recognizeFoodFromBase64,
  addFoodRecordByName,
  analyzeFoodNutrition,
  recognizeFoodFromText
}
