/**
 * 饮食记录数据模型
 */
const { database } = require('../../core')

const dietDb = database.createDbOperations('diet_records')

/**
 * 根据用户ID查询饮食记录列表
 */
async function findByUserId(userId, options = {}) {
  let sql = 'SELECT * FROM diet_records WHERE user_id = ?'
  const params = [userId]

  // 支持按餐次筛选
  if (options.mealType) {
    sql += ' AND meal_type = ?'
    params.push(options.mealType)
  }

  // 支持按日期范围筛选
  if (options.startDate) {
    sql += ' AND record_date >= ?'
    params.push(options.startDate)
  }
  if (options.endDate) {
    sql += ' AND record_date <= ?'
    params.push(options.endDate)
  }

  // 排序：最新的在前
  sql += ' ORDER BY record_date DESC, created_at DESC'

  // 支持分页
  if (options.limit) {
    sql += ' LIMIT ?'
    params.push(options.limit)
    if (options.offset) {
      sql += ' OFFSET ?'
      params.push(options.offset)
    }
  }

  return await dietDb.query(sql, params)
}

/**
 * 根据ID查询单条饮食记录
 */
async function findById(id) {
  const sql = 'SELECT * FROM diet_records WHERE id = ?'
  return await dietDb.queryOne(sql, [id])
}

/**
 * 创建饮食记录
 */
async function create(recordData) {
  const insertData = {
    user_id: recordData.userId,
    meal_type: recordData.mealType,
    food_name: recordData.foodName,
    calories: recordData.calories || 0,
    protein: recordData.protein || 0,
    carbs: recordData.carbs || 0,
    fat: recordData.fat || 0,
    fiber: recordData.fiber || 0,
    record_date: recordData.recordDate || new Date().toISOString().split('T')[0]
  }

  return await dietDb.create(insertData)
}

/**
 * 删除饮食记录
 */
async function deleteById(id, userId) {
  const sql = 'DELETE FROM diet_records WHERE id = ? AND user_id = ?'
  const result = await dietDb.query(sql, [id, userId])
  return result.affectedRows > 0
}

/**
 * 获取今日饮食统计
 */
async function getTodayStats(userId) {
  const sql = `
    SELECT 
      COALESCE(SUM(calories), 0) as totalCalories,
      COALESCE(SUM(protein), 0) as totalProtein,
      COALESCE(SUM(carbs), 0) as totalCarbs,
      COALESCE(SUM(fat), 0) as totalFat,
      COALESCE(SUM(fiber), 0) as totalFiber
    FROM diet_records
    WHERE user_id = ? AND record_date = CURDATE()
  `
  return await dietDb.queryOne(sql, [userId])
}

module.exports = {
  findByUserId,
  findById,
  create,
  deleteById,
  getTodayStats
}



