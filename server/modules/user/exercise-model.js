/**
 * 运动记录数据模型
 */
const { database } = require('../../core')

const exerciseDb = database.createDbOperations('exercise_records')

/**
 * 根据用户ID查询运动记录列表
 */
async function findByUserId(userId, options = {}) {
  let sql = 'SELECT * FROM exercise_records WHERE user_id = ?'
  const params = [userId]

  // 支持按类型筛选
  if (options.exerciseType) {
    sql += ' AND exercise_type = ?'
    params.push(options.exerciseType)
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

  return await exerciseDb.query(sql, params)
}

/**
 * 根据ID查询单条运动记录
 */
async function findById(id) {
  const sql = 'SELECT * FROM exercise_records WHERE id = ?'
  return await exerciseDb.queryOne(sql, [id])
}

/**
 * 创建运动记录
 */
async function create(recordData) {
  const insertData = {
    user_id: recordData.userId,
    exercise_type: recordData.exerciseType,
    exercise_id: recordData.exerciseId,
    duration: recordData.duration,
    calories: recordData.calories || 0,
    distance: recordData.distance || null,
    record_date: recordData.recordDate || new Date().toISOString().split('T')[0]
  }

  return await exerciseDb.create(insertData)
}

/**
 * 删除运动记录
 */
async function deleteById(id, userId) {
  const sql = 'DELETE FROM exercise_records WHERE id = ? AND user_id = ?'
  const result = await exerciseDb.query(sql, [id, userId])
  return result.affectedRows > 0
}

/**
 * 获取今日运动统计
 */
async function getTodayStats(userId) {
  const sql = `
    SELECT 
      COALESCE(SUM(duration), 0) as totalDuration,
      COALESCE(SUM(calories), 0) as totalCalories,
      COALESCE(SUM(distance), 0) as totalDistance
    FROM exercise_records
    WHERE user_id = ? AND record_date = CURDATE()
  `
  return await exerciseDb.queryOne(sql, [userId])
}

/**
 * 获取本周运动记录
 */
async function getWeekRecords(userId) {
  const sql = `
    SELECT * FROM exercise_records
    WHERE user_id = ? 
      AND record_date >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
    ORDER BY record_date DESC, created_at DESC
  `
  return await exerciseDb.query(sql, [userId])
}

module.exports = {
  findByUserId,
  findById,
  create,
  deleteById,
  getTodayStats,
  getWeekRecords
}




