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
 * 从图片Base64识别食物（对外接口）
 */
async function recognizeFoodFromBase64(imageBase64) {
  // 从环境变量或配置读取百度API密钥
  const config = require('../../../config')
  const apiKey = process.env.BAIDU_API_KEY || config.baidu?.apiKey
  const secretKey = process.env.BAIDU_SECRET_KEY || config.baidu?.secretKey

  // 获取access_token
  const accessToken = await getBaiduAccessToken(apiKey, secretKey)

  if (!accessToken) {
    return { result: [] }
  }

  // 检查图片大小（百度API限制4MB）
  if (imageBase64.length > 4 * 1024 * 1024) {
    return { result: [] }
  }

  // 直接调用百度菜品识别API
  const recognitionResult = await callBaiduFoodApi(imageBase64, accessToken)

  // 只返回result数组，如果没有识别结果则返回空数组，取前6个
  const resultArray = (recognitionResult.result || []).slice(0, 10)

  // 将相似度格式化为保留两位小数
  return resultArray.map(item => ({
    ...item,
    probability: (parseFloat(item.probability) * 100).toFixed(2) + '%' // 转换为百分比并保留2位小数
  }))
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

module.exports = {
  getCategories,
  getFoodsByCategory,
  searchFoods,
  getUnitsByFood,
  calculateNutrition,
  addFoodRecordByName,
  recognizeFoodFromImage,
  recognizeFoodFromBase64
}
