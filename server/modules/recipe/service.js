/**
 * 食谱业务逻辑
 */
const recipeModel = require('./model')
const userModel = require('../user/model')

/**
 * 通过openId获取userId
 */
const getUserIdByOpenId = async (openId) => {
  const user = await userModel.findByOpenId(openId)
  if (!user) {
    throw new Error('用户不存在')
  }
  return user.id
}

/**
 * 获取所有食谱分类
 */
const getAllGroups = async () => {
  return await recipeModel.getAllGroups()
}

/**
 * 根据分类ID获取食谱列表
 */
const getRecipesByGroupId = async (groupId) => {
  if (!groupId) {
    throw new Error('分类ID不能为空')
  }
  return await recipeModel.getRecipesByGroupId(groupId)
}

/**
 * 通过openId获取用户收藏的食谱列表（我的食谱）
 */
const getUserFavoriteRecipesByOpenId = async (openId) => {
  if (!openId) {
    throw new Error('openId不能为空')
  }
  const userId = await getUserIdByOpenId(openId)
  return await recipeModel.getUserFavoriteRecipes(userId)
}

/**
 * 获取食谱详情（包含基本信息和所有天数）
 */
const getRecipeDetail = async (recipeId, openId = null) => {
  if (!recipeId) {
    throw new Error('食谱ID不能为空')
  }

  // 获取食谱基本信息
  const recipe = await recipeModel.getRecipeById(recipeId)
  if (!recipe) {
    throw new Error('食谱不存在')
  }

  // 获取所有日餐单
  const dailyMeals = await recipeModel.getDailyMealsByRecipeId(recipeId)

  // 如果提供了openId，检查是否已收藏
  let isFavorite = false
  if (openId) {
    try {
      const userId = await getUserIdByOpenId(openId)
      isFavorite = await recipeModel.checkUserFavorite(userId, recipeId)
    } catch (error) {
      // 用户不存在时，isFavorite保持为false
      console.warn('获取收藏状态失败:', error.message)
    }
  }

  return {
    ...recipe,
    isFavorite,
    dailyMeals: dailyMeals.map(meal => ({
      id: meal.id,
      dayNumber: meal.dayNumber,
      dayName: meal.dayName
    }))
  }
}

/**
 * 通过openId添加收藏
 */
const addFavoriteByOpenId = async (openId, recipeId, notes = null) => {
  if (!openId || !recipeId) {
    throw new Error('openId和食谱ID不能为空')
  }
  
  const userId = await getUserIdByOpenId(openId)
  
  // 检查食谱是否存在且可见
  const recipe = await recipeModel.getRecipeById(recipeId)
  if (!recipe) {
    throw new Error('食谱不存在或不可见')
  }
  
  await recipeModel.addFavorite(userId, recipeId, notes)
  return { success: true }
}

/**
 * 通过openId取消收藏
 */
const removeFavoriteByOpenId = async (openId, recipeId) => {
  if (!openId || !recipeId) {
    throw new Error('openId和食谱ID不能为空')
  }
  
  const userId = await getUserIdByOpenId(openId)
  await recipeModel.removeFavorite(userId, recipeId)
  return { success: true }
}

/**
 * 通过openId检查是否收藏
 */
const checkUserFavoriteByOpenId = async (openId, recipeId) => {
  if (!openId || !recipeId) {
    throw new Error('openId和食谱ID不能为空')
  }
  
  const userId = await getUserIdByOpenId(openId)
  return await recipeModel.checkUserFavorite(userId, recipeId)
}

/**
 * 获取指定天数的饮食安排（支持多规格）
 */
const getDailyMealDetail = async (dailyMealId) => {
  if (!dailyMealId) {
    throw new Error('日餐单ID不能为空')
  }

  // 获取该天的所有食物（已包含规格信息和准确的卡路里计算）
  const foods = await recipeModel.getFoodsByDailyMealId(dailyMealId)

  // 按餐次分组
  const mealTypeMap = {
    breakfast: { name: '早餐', icon: '☀️', list: [], calories: 0 },
    lunch: { name: '午餐', icon: '🌤️', list: [], calories: 0 },
    dinner: { name: '晚餐', icon: '🌙', list: [], calories: 0 },
    snack: { name: '加餐', icon: '🍎', list: [], calories: 0 }
  }

  foods.forEach(food => {
    const mealType = food.mealType
    if (mealTypeMap[mealType]) {
      const foodCalories = food.foodCalories ? Math.round(food.foodCalories) : 0
      
      mealTypeMap[mealType].list.push({
        foodName: food.foodName,
        foodCount: food.foodCount,
        unit: food.unit,
        foodId: food.foodId,
        foodImgUrl: food.foodImgUrl || null,
        foodCalories: foodCalories
      })
      
      // 累加餐次热量
      mealTypeMap[mealType].calories += foodCalories
    }
  })

  // 只返回有食物的餐次
  const meals = []
  Object.keys(mealTypeMap).forEach(key => {
    if (mealTypeMap[key].list.length > 0) {
      meals.push({
        type: key,
        name: mealTypeMap[key].name,
        icon: mealTypeMap[key].icon,
        calories: mealTypeMap[key].calories,
        foods: mealTypeMap[key].list
      })
    }
  })

  return meals
}

/**
 * 获取食物的所有规格
 */
const getFoodSpecs = async (foodId) => {
  if (!foodId) {
    throw new Error('食物ID不能为空')
  }
  return await recipeModel.getFoodSpecs(foodId)
}

/**
 * 获取食物详情（包含所有规格）
 */
const getFoodDetail = async (foodId) => {
  if (!foodId) {
    throw new Error('食物ID不能为空')
  }

  const foodWithSpecs = await recipeModel.getFoodWithSpecs(foodId)
  if (!foodWithSpecs || foodWithSpecs.length === 0) {
    throw new Error('食物不存在')
  }

  // 第一条记录包含食物基本信息
  const baseFood = foodWithSpecs[0]
  
  // 提取规格信息
  const specs = foodWithSpecs
    .filter(item => item.specId) // 过滤掉没有规格的记录
    .map(item => ({
      specId: item.specId,
      specName: item.specName,
      referUnit: item.referUnit,
      unitCount: item.unitCount,
      unitWeight: item.unitWeight,
      isDefault: item.isDefault,
      caloriesPerUnit: item.caloriesPerUnit
    }))

  return {
    foodId: baseFood.foodId,
    foodName: baseFood.foodName,
    caloryPer100g: baseFood.caloryPer100g,
    imgUrl: baseFood.imgUrl,
    category: baseFood.category,
    baseUnit: baseFood.baseUnit,
    defaultReferUnit: baseFood.defaultReferUnit,
    defaultUnitCount: baseFood.defaultUnitCount,
    specs: specs
  }
}

/**
 * ==================== 打卡相关 ====================
 */

/**
 * 获取激励文案
 */
const getEncouragementText = (completionRate) => {
  if (completionRate >= 100) {
    return '恭喜完成整个食谱计划 🎊'
  } else if (completionRate >= 90) {
    return '胜利就在眼前，再接再厉 💪'
  } else if (completionRate >= 60) {
    return '你已经超过大多数人了 💪'
  } else if (completionRate >= 30) {
    return '坚持就是胜利，继续加油 💪'
  } else {
    return '良好的开始是成功的一半 💪'
  }
}

/**
 * 通过openId获取打卡进度
 */
const getCheckInProgressByOpenId = async (openId, recipeId) => {
  if (!openId || !recipeId) {
    throw new Error('openId和食谱ID不能为空')
  }
  
  const userId = await getUserIdByOpenId(openId)
  
  // 获取食谱信息
  const recipe = await recipeModel.getRecipeById(recipeId)
  if (!recipe) {
    throw new Error('食谱不存在')
  }
  
  // 获取打卡统计
  const stats = await recipeModel.getCheckInProgress(userId, recipeId)
  
  const { totalDays } = stats || {}

  // 获取打卡历史
  const history = await recipeModel.getCheckInHistory(userId, recipeId)
  
  // 构建每天的打卡状态（使用 Set 提升查询性能）
  const checkedDaysSet = new Set(history.map(record => record.dayNumber))
  const dayCheckStatus = {}
  
  // 初始化所有天数的打卡状态
  for (let i = 1; i <= totalDays; i++) {
    dayCheckStatus[i] = checkedDaysSet.has(i)
  }
  
  // 计算下一个应该打卡的天数
  let nextDay = totalDays + 1 // 默认为已完成状态
  for (let i = 1; i <= totalDays; i++) {
    if (!dayCheckStatus[i]) {
      nextDay = i
      break
    }
  }
  
  return {
    recipeId: parseInt(recipeId),
    recipeName: recipe.name,
    totalDays,
    checkedDays: stats?.checkedDays || 0,
    lastCheckedDay: stats?.lastCheckedDay || 0,
    nextDay: nextDay > totalDays ? totalDays : nextDay,
    completionRate: stats ? parseFloat(((stats.checkedDays / totalDays) * 100).toFixed(2)) : 0,
    isCompleted: stats?.isCompleted === 1,
    hasCheckInRecord: !!stats,
    lastCheckInDate: stats?.lastCheckInDate || null,
    startDate: stats?.startDate || null,
    checkInHistory: history,
    dayCheckStatus
  }
}

/**
 * 通过openId执行打卡
 */
const checkInByOpenId = async (openId, recipeId, dailyMealId, dayNumber, notes = null) => {
  if (!openId || !recipeId || !dailyMealId || !dayNumber) {
    throw new Error('参数不完整')
  }
  
  const userId = await getUserIdByOpenId(openId)
  
  // 获取食谱总天数
  const dailyMeals = await recipeModel.getDailyMealsByRecipeId(recipeId)
  const totalDays = dailyMeals.length
  
  if (dayNumber < 1 || dayNumber > totalDays) {
    throw new Error('周期索引无效')
  }
  
  // 检查该周期是否已打卡
  const alreadyCheckedIn = await recipeModel.checkDayCheckedIn(userId, recipeId, dayNumber)
  if (alreadyCheckedIn) {
    throw new Error('该周期已打卡，不能重复打卡')
  }
  
  // 检查是否按顺序打卡（不能跳过）
  const maxCheckedDay = await recipeModel.getMaxCheckedDay(userId, recipeId)
  if (dayNumber > maxCheckedDay + 1) {
    throw new Error(`请先完成第${maxCheckedDay + 1}天的打卡`)
  }
  
  // 执行打卡
  await recipeModel.createCheckIn(userId, recipeId, dailyMealId, dayNumber, notes)
  
  // 获取当前已打卡天数
  const history = await recipeModel.getCheckInHistory(userId, recipeId)
  const checkedDays = history.length
  const isCompleted = checkedDays === totalDays
  
  // 更新统计
  await recipeModel.upsertCheckInStats(userId, recipeId, totalDays, checkedDays, dayNumber, isCompleted ? 1 : 0)
  
  // 计算完成率
  const completionRate = parseFloat(((checkedDays / totalDays) * 100).toFixed(0))
  
  return {
    checkInId: history[history.length - 1]?.id,
    dayNumber,
    checkedDays,
    totalDays,
    completionRate,
    isCompleted,
    isLastDay: dayNumber === totalDays,
    encouragement: getEncouragementText(completionRate)
  }
}

/**
 * 通过openId重置打卡记录
 */
const resetCheckInByOpenId = async (openId, recipeId) => {
  if (!openId || !recipeId) {
    throw new Error('openId和食谱ID不能为空')
  }
  
  const userId = await getUserIdByOpenId(openId)
  await recipeModel.deleteCheckInRecords(userId, recipeId)
  
  return { success: true, message: '打卡记录已重置' }
}

/**
 * 通过openId获取打卡历史
 */
const getCheckInHistoryByOpenId = async (openId, recipeId) => {
  if (!openId || !recipeId) {
    throw new Error('openId和食谱ID不能为空')
  }
  
  const userId = await getUserIdByOpenId(openId)
  
  // 获取食谱信息
  const recipe = await recipeModel.getRecipeById(recipeId)
  if (!recipe) {
    throw new Error('食谱不存在')
  }
  
  // 获取打卡历史
  const history = await recipeModel.getCheckInHistory(userId, recipeId)
  
  return {
    recipeId: parseInt(recipeId),
    recipeName: recipe.name,
    totalCheckIns: history.length,
    checkInList: history
  }
}

module.exports = {
  getAllGroups,
  getRecipesByGroupId,
  getRecipeDetail,
  getDailyMealDetail,
  getFoodSpecs,
  getFoodDetail,
  getUserFavoriteRecipesByOpenId,
  checkUserFavoriteByOpenId,
  addFavoriteByOpenId,
  removeFavoriteByOpenId,
  // 打卡相关
  getCheckInProgressByOpenId,
  checkInByOpenId,
  resetCheckInByOpenId,
  getCheckInHistoryByOpenId
}
