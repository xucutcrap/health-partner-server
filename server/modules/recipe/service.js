/**
 * 食谱业务逻辑
 */
const recipeModel = require('./model')

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
 * 获取食谱详情（包含基本信息和所有天数）
 */
const getRecipeDetail = async (recipeId) => {
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

  return {
    ...recipe,
    dailyMeals: dailyMeals.map(meal => ({
      id: meal.id,
      dayNumber: meal.dayNumber,
      dayName: meal.dayName,
      totalCalories: meal.totalCalories
    }))
  }
}

/**
 * 获取指定天数的饮食安排
 */
const getDailyMealDetail = async (dailyMealId) => {
  if (!dailyMealId) {
    throw new Error('日餐单ID不能为空')
  }

  // 获取该天的所有食物（使用视图 daily_foods_detail，已计算好卡路里）
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
      mealTypeMap[mealType].list.push({
        foodName: food.foodName,
        foodCount: food.foodCount,
        unit: food.unit,
        foodId: food.foodId,
        foodImgUrl: food.foodImgUrl || null,
        foodCalories: food.foodCalories ? Math.round(food.foodCalories) : 0
      })
      
      // 累加餐次热量（如果有的话）
      if (food.mealCalories) {
        mealTypeMap[mealType].calories = food.mealCalories
      }
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

module.exports = {
  getAllGroups,
  getRecipesByGroupId,
  getRecipeDetail,
  getDailyMealDetail
}

