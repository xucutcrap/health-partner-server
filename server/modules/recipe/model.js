/**
 * 食谱数据模型
 */
const { query, queryOne } = require('../../core/database')

/**
 * 获取所有食谱分类
 */
const getAllGroups = async () => {
  const sql = `
    SELECT 
      group_id as groupId,
      group_name as groupName,
      display_order as displayOrder,
      is_active as isActive
    FROM recipe_groups
    WHERE is_active = 1
    ORDER BY display_order ASC, group_id ASC
  `
  return await query(sql)
}

/**
 * 根据分类ID获取食谱列表
 */
const getRecipesByGroupId = async (groupId) => {
  const sql = `
    SELECT 
      r.id,
      r.name,
      r.intro,
      r.pic_url as picUrl,
      r.promotion,
      r.display_count as displayCount,
      r.footer,
      r.recommend_text as recommendText
    FROM recipes r
    INNER JOIN recipe_group_relations rgr ON r.id = rgr.recipe_id
    WHERE rgr.group_id = ?
    ORDER BY rgr.display_order ASC, r.id ASC
  `
  return await query(sql, [groupId])
}

/**
 * 根据食谱ID获取食谱详情
 */
const getRecipeById = async (recipeId) => {
  const sql = `
    SELECT 
      id,
      name,
      intro,
      pic_url as picUrl,
      promotion,
      display_count as displayCount,
      footer,
      recommend_text as recommendText
    FROM recipes
    WHERE id = ?
  `
  return await queryOne(sql, [recipeId])
}

/**
 * 获取食谱的所有日餐单
 */
const getDailyMealsByRecipeId = async (recipeId) => {
  const sql = `
    SELECT 
      id,
      recipe_id as recipeId,
      day_number as dayNumber,
      day_name as dayName,
      total_calories as totalCalories,
      display_order as displayOrder
    FROM recipe_daily_meals
    WHERE recipe_id = ?
    ORDER BY day_number ASC
  `
  return await query(sql, [recipeId])
}

/**
 * 根据日餐单ID获取该天的所有食物（按餐次分组）
 */
const getFoodsByDailyMealId = async (dailyMealId) => {
  const sql = `
    SELECT 
      id,
      daily_meal_id as dailyMealId,
      meal_type as mealType,
      meal_name as mealName,
      meal_calories as mealCalories,
      food_name as foodName,
      food_count as foodCount,
      unit,
      display_order as displayOrder,
      food_img_url as foodImgUrl,
      food_id as foodId,
      food_calories as foodCalories
    FROM daily_foods_detail
    WHERE daily_meal_id = ?
    ORDER BY 
      FIELD(meal_type, 'breakfast', 'lunch', 'dinner', 'snack'),
      display_order ASC
  `
  return await query(sql, [dailyMealId])
}

module.exports = {
  getAllGroups,
  getRecipesByGroupId,
  getRecipeById,
  getDailyMealsByRecipeId,
  getFoodsByDailyMealId
}

