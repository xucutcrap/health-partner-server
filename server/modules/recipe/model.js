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
    WHERE rgr.group_id = ? AND r.is_visible = 1
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
    WHERE id = ? AND is_visible = 1
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
      display_order as displayOrder
    FROM recipe_daily_meals
    WHERE recipe_id = ?
    ORDER BY day_number ASC
  `
  return await query(sql, [recipeId])
}

/**
 * 根据日餐单ID获取该天的所有食物（按餐次分组，支持多规格）
 */
const getFoodsByDailyMealId = async (dailyMealId) => {
  const sql = `
    SELECT 
      df.id,
      df.daily_meal_id as dailyMealId,
      df.meal_type as mealType,
      df.meal_name as mealName,
      df.food_count as foodCount,
      df.unit,
      df.display_order as displayOrder,
      df.food_id as foodId,
      
      -- 食物基本信息
      f.food_name as foodName,
      f.calory_per_100g as caloryPer100g,
      f.img_url as foodImgUrl,
      f.category as foodCategory,
      
      -- 规格信息（只有单位精确匹配时才返回规格数据）
      spec_info.spec_id as specId,
      spec_info.spec_name as specName,
      spec_info.refer_unit as referUnit,
      spec_info.unit_count as unitCount,
      spec_info.is_default as isDefault,
      
      -- 计算准确的卡路里
      CASE
        -- 情况1: 用户使用基础单位（克或毫升），直接根据重量计算
        WHEN df.unit COLLATE utf8mb4_unicode_ci = '克' COLLATE utf8mb4_unicode_ci 
             OR df.unit COLLATE utf8mb4_unicode_ci = '毫升' COLLATE utf8mb4_unicode_ci THEN
            ROUND((df.food_count / 100.0) * f.calory_per_100g, 2)
            
        -- 情况2: 单位精确匹配food_specs表中的refer_unit，使用规格的unit_count
        WHEN spec_info.unit_count IS NOT NULL 
             AND df.unit COLLATE utf8mb4_unicode_ci = spec_info.refer_unit COLLATE utf8mb4_unicode_ci THEN
            ROUND((df.food_count * spec_info.unit_count / 100.0) * f.calory_per_100g, 2)
            
        -- 情况3: 单位精确匹配foods表中的refer_unit，使用foods表的unit_count
        WHEN f.unit_count IS NOT NULL 
             AND df.unit COLLATE utf8mb4_unicode_ci = f.refer_unit COLLATE utf8mb4_unicode_ci THEN
            ROUND((df.food_count * f.unit_count / 100.0) * f.calory_per_100g, 2)
            
        -- 情况4: 无法匹配单位，返回NULL
        ELSE NULL
      END AS foodCalories,
      
      -- 单位卡路里（每个单位的卡路里）- 优先使用精确匹配的规格数据
      CASE
        WHEN spec_info.unit_count IS NOT NULL 
             AND df.unit COLLATE utf8mb4_unicode_ci = spec_info.refer_unit COLLATE utf8mb4_unicode_ci THEN
            ROUND((spec_info.unit_count / 100.0) * f.calory_per_100g, 2)
        WHEN f.unit_count IS NOT NULL 
             AND df.unit COLLATE utf8mb4_unicode_ci = f.refer_unit COLLATE utf8mb4_unicode_ci THEN
            ROUND((f.unit_count / 100.0) * f.calory_per_100g, 2)
        ELSE NULL
      END as caloriesPerUnit
      
    FROM daily_foods df
    LEFT JOIN foods f ON df.food_id = f.food_id
    
    -- 只JOIN单位精确匹配的规格（不考虑默认规格）
    LEFT JOIN food_specs spec_info 
      ON f.food_id = spec_info.food_id
      AND df.unit COLLATE utf8mb4_unicode_ci = spec_info.refer_unit COLLATE utf8mb4_unicode_ci
    
    WHERE df.daily_meal_id = ?
    ORDER BY 
      FIELD(df.meal_type, 'breakfast', 'lunch', 'dinner', 'snack'),
      df.display_order ASC
  `
  return await query(sql, [dailyMealId])
}

/**
 * 获取食物的所有规格
 */
const getFoodSpecs = async (foodId) => {
  const sql = `
    SELECT 
      fs.spec_id as specId,
      fs.food_id as foodId,
      fs.spec_name as specName,
      fs.refer_unit as referUnit,
      fs.unit_count as unitCount,
      fs.is_default as isDefault,
      f.calory_per_100g as caloryPer100g,
      -- 计算每个规格的卡路里
      ROUND((fs.unit_count / 100.0) * f.calory_per_100g, 2) as caloriesPerUnit
    FROM food_specs fs
    INNER JOIN foods f ON fs.food_id = f.food_id
    WHERE fs.food_id = ?
    ORDER BY fs.is_default DESC, fs.spec_name ASC
  `
  return await query(sql, [foodId])
}

/**
 * 获取食物的默认规格
 */
const getFoodDefaultSpec = async (foodId) => {
  const sql = `
    SELECT 
      fs.spec_id as specId,
      fs.food_id as foodId,
      fs.spec_name as specName,
      fs.refer_unit as referUnit,
      fs.unit_count as unitCount,
      fs.is_default as isDefault,
      f.calory_per_100g as caloryPer100g,
      ROUND((fs.unit_count / 100.0) * f.calory_per_100g, 2) as caloriesPerUnit
    FROM food_specs fs
    INNER JOIN foods f ON fs.food_id = f.food_id
    WHERE fs.food_id = ? AND fs.is_default = 1
    LIMIT 1
  `
  return await queryOne(sql, [foodId])
}

/**
 * 根据食物ID和单位获取匹配的规格
 */
const getFoodSpecByUnit = async (foodId, unit) => {
  const sql = `
    SELECT 
      fs.spec_id as specId,
      fs.food_id as foodId,
      fs.spec_name as specName,
      fs.refer_unit as referUnit,
      fs.unit_count as unitCount,
      fs.is_default as isDefault,
      f.calory_per_100g as caloryPer100g,
      ROUND((fs.unit_count / 100.0) * f.calory_per_100g, 2) as caloriesPerUnit
    FROM food_specs fs
    INNER JOIN foods f ON fs.food_id = f.food_id
    WHERE fs.food_id = ? 
      AND fs.refer_unit COLLATE utf8mb4_unicode_ci = ? COLLATE utf8mb4_unicode_ci
    LIMIT 1
  `
  return await queryOne(sql, [foodId, unit])
}

/**
 * 获取带规格信息的食物详情
 */
const getFoodWithSpecs = async (foodId) => {
  const sql = `
    SELECT 
      f.food_id as foodId,
      f.food_name as foodName,
      f.calory_per_100g as caloryPer100g,
      f.img_url as imgUrl,
      f.category,
      f.unit as baseUnit,
      f.refer_unit as defaultReferUnit,
      f.unit_count as defaultUnitCount,
      
      -- 规格信息
      fs.spec_id as specId,
      fs.spec_name as specName,
      fs.refer_unit as referUnit,
      fs.unit_count as unitCount,
      fs.is_default as isDefault,
      ROUND((fs.unit_count / 100.0) * f.calory_per_100g, 2) as caloriesPerUnit
      
    FROM foods f
    LEFT JOIN food_specs fs ON f.food_id = fs.food_id
    WHERE f.food_id = ?
    ORDER BY fs.is_default DESC, fs.spec_name ASC
  `
  return await query(sql, [foodId])
}

/**
 * 获取用户收藏的食谱列表（我的食谱）
 */
const getUserFavoriteRecipes = async (userId) => {
  const sql = `
    SELECT 
      r.id,
      r.name,
      r.intro,
      r.pic_url as picUrl,
      r.promotion,
      r.display_count as displayCount,
      r.footer,
      r.recommend_text as recommendText,
      ufr.favorite_time as favoriteTime
    FROM user_favorite_recipes ufr
    INNER JOIN recipes r ON ufr.recipe_id = r.id
    WHERE ufr.user_id = ? AND r.is_visible = 1
    ORDER BY ufr.favorite_time DESC
  `
  return await query(sql, [userId])
}

/**
 * 检查用户是否收藏了某个食谱
 */
const checkUserFavorite = async (userId, recipeId) => {
  const sql = `
    SELECT id
    FROM user_favorite_recipes
    WHERE user_id = ? AND recipe_id = ?
    LIMIT 1
  `
  const result = await queryOne(sql, [userId, recipeId])
  return !!result
}

/**
 * 添加收藏
 */
const addFavorite = async (userId, recipeId, notes = null) => {
  const sql = `
    INSERT INTO user_favorite_recipes (user_id, recipe_id, notes)
    VALUES (?, ?, ?)
    ON DUPLICATE KEY UPDATE notes = VALUES(notes)
  `
  return await query(sql, [userId, recipeId, notes])
}

/**
 * 取消收藏
 */
const removeFavorite = async (userId, recipeId) => {
  const sql = `
    DELETE FROM user_favorite_recipes
    WHERE user_id = ? AND recipe_id = ?
  `
  return await query(sql, [userId, recipeId])
}

/**
 * ==================== 打卡相关 ====================
 */

/**
 * 获取用户在某个食谱的打卡进度
 */
const getCheckInProgress = async (userId, recipeId) => {
  const sql = `
    SELECT 
      user_id as userId,
      recipe_id as recipeId,
      total_days as totalDays,
      checked_days as checkedDays,
      last_checked_day as lastCheckedDay,
      last_check_in_date as lastCheckInDate,
      start_date as startDate,
      completion_date as completionDate,
      is_completed as isCompleted
    FROM recipe_check_in_stats
    WHERE user_id = ? AND recipe_id = ?
  `
  return await queryOne(sql, [userId, recipeId])
}

/**
 * 获取用户在某个食谱的所有打卡记录
 */
const getCheckInHistory = async (userId, recipeId) => {
  const sql = `
    SELECT 
      ci.id,
      ci.day_number as dayNumber,
      ci.check_in_date as checkInDate,
      ci.check_in_time as checkInTime,
      ci.notes,
      dm.day_name as dayName
    FROM recipe_check_ins ci
    LEFT JOIN recipe_daily_meals dm ON ci.daily_meal_id = dm.id
    WHERE ci.user_id = ? AND ci.recipe_id = ?
    ORDER BY ci.day_number ASC
  `
  return await query(sql, [userId, recipeId])
}

/**
 * 检查某个周期是否已打卡
 */
const checkDayCheckedIn = async (userId, recipeId, dayNumber) => {
  const sql = `
    SELECT id
    FROM recipe_check_ins
    WHERE user_id = ? AND recipe_id = ? AND day_number = ?
    LIMIT 1
  `
  const result = await queryOne(sql, [userId, recipeId, dayNumber])
  return !!result
}

/**
 * 获取已打卡的最大周期索引
 */
const getMaxCheckedDay = async (userId, recipeId) => {
  const sql = `
    SELECT MAX(day_number) as maxDay
    FROM recipe_check_ins
    WHERE user_id = ? AND recipe_id = ?
  `
  const result = await queryOne(sql, [userId, recipeId])
  return result?.maxDay || 0
}

/**
 * 执行打卡
 */
const createCheckIn = async (userId, recipeId, dailyMealId, dayNumber, notes = null) => {
  const sql = `
    INSERT INTO recipe_check_ins (user_id, recipe_id, daily_meal_id, day_number, check_in_date, notes)
    VALUES (?, ?, ?, ?, CURDATE(), ?)
  `
  return await query(sql, [userId, recipeId, dailyMealId, dayNumber, notes])
}

/**
 * 更新或创建打卡统计
 */
const upsertCheckInStats = async (userId, recipeId, totalDays, checkedDays, lastCheckedDay, isCompleted) => {
  // 先查询是否存在记录，获取start_date
  const existingSql = `
    SELECT start_date as startDate
    FROM recipe_check_in_stats
    WHERE user_id = ? AND recipe_id = ?
  `
  const existing = await queryOne(existingSql, [userId, recipeId])
  const startDate = existing?.startDate || null
  
  // 如果存在记录，执行更新
  if (existing) {
    const updateSql = `
      UPDATE recipe_check_in_stats
      SET 
        total_days = ?,
        checked_days = ?,
        last_checked_day = ?,
        last_check_in_date = CURDATE(),
        completion_date = ${isCompleted ? 'CURDATE()' : 'NULL'},
        is_completed = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE user_id = ? AND recipe_id = ?
    `
    return await query(updateSql, [totalDays, checkedDays, lastCheckedDay, isCompleted, userId, recipeId])
  } else {
    // 如果不存在，执行插入
    const insertSql = `
      INSERT INTO recipe_check_in_stats 
        (user_id, recipe_id, total_days, checked_days, last_checked_day, 
         last_check_in_date, start_date, completion_date, is_completed)
      VALUES 
        (?, ?, ?, ?, ?, CURDATE(), CURDATE(), ${isCompleted ? 'CURDATE()' : 'NULL'}, ?)
    `
    return await query(insertSql, [userId, recipeId, totalDays, checkedDays, lastCheckedDay, isCompleted])
  }
}

/**
 * 删除用户在某个食谱的所有打卡记录
 */
const deleteCheckInRecords = async (userId, recipeId) => {
  // 删除打卡记录
  const sql1 = `
    DELETE FROM recipe_check_ins
    WHERE user_id = ? AND recipe_id = ?
  `
  await query(sql1, [userId, recipeId])
  
  // 删除统计记录
  const sql2 = `
    DELETE FROM recipe_check_in_stats
    WHERE user_id = ? AND recipe_id = ?
  `
  return await query(sql2, [userId, recipeId])
}

/**
 * 获取推荐食谱
 */
const getRecommendedRecipes = async (limit = 6) => {
  const sql = `
    SELECT 
      id,
      name,
      intro,
      pic_url as picUrl,
      promotion,
      recommend_order as recommendOrder,
      recommend_text as recommendText,
      usage_text as usageText
    FROM recipes
    WHERE recommend_order IS NOT NULL
    ORDER BY recommend_order ASC
    LIMIT ?
  `
  return await query(sql, [limit])
}

module.exports = {
  getAllGroups,
  getRecipesByGroupId,
  getRecipeById,
  getDailyMealsByRecipeId,
  getFoodsByDailyMealId,
  getFoodSpecs,
  getFoodDefaultSpec,
  getFoodSpecByUnit,
  getFoodWithSpecs,
  getUserFavoriteRecipes,
  checkUserFavorite,
  addFavorite,
  removeFavorite,
  // 打卡相关
  getCheckInProgress,
  getCheckInHistory,
  checkDayCheckedIn,
  getMaxCheckedDay,
  createCheckIn,
  upsertCheckInStats,
  deleteCheckInRecords,
  getRecommendedRecipes
}


