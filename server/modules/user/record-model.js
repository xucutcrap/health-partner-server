/**
 * 用户记录数据模型（用于统计今日完成情况和打卡）
 */
const { database } = require('../../core')

const recordDb = database.createDbOperations()

/**
 * 获取今日运动总时长（分钟）
 */
async function getTodayExerciseTotal(userId) {
  const sql = `
    SELECT COALESCE(SUM(duration), 0) as total 
    FROM exercise_records 
    WHERE user_id = ? AND record_date = CURDATE()
  `
  const result = await recordDb.queryOne(sql, [userId])
  return result?.total || 0
}

/**
 * 获取今日饮水总杯数
 */
async function getTodayWaterTotal(userId) {
  const sql = `
    SELECT COALESCE(SUM(amount), 0) as total 
    FROM water_records 
    WHERE user_id = ? AND record_date = CURDATE()
  `
  const result = await recordDb.queryOne(sql, [userId])
  return result?.total || 0
}

/**
 * 获取今日步数（从健康记录中获取，record_type='步数'）
 */
async function getTodayStepsTotal(userId) {
  const sql = `
    SELECT COALESCE(SUM(value), 0) as total 
    FROM health_records 
    WHERE user_id = ? AND record_type = '步数' AND record_date = CURDATE()
  `
  const result = await recordDb.queryOne(sql, [userId])
  return result?.total || 0
}

/**
 * 快速添加运动记录
 */
async function addExerciseRecord(userId, duration) {
  const sql = `
    INSERT INTO exercise_records (user_id, exercise_type, duration, calories, record_date, created_at)
    VALUES (?, '其他', ?, 0, CURDATE(), NOW())
  `
  await recordDb.query(sql, [userId, duration])
  return true
}

/**
 * 快速添加饮水记录
 */
async function addWaterRecord(userId, amount = 1) {
  const sql = `
    INSERT INTO water_records (user_id, amount, record_date, created_at)
    VALUES (?, ?, CURDATE(), NOW())
  `
  await recordDb.query(sql, [userId, amount])
  return true
}

/**
 * 快速添加步数记录
 */
async function addStepsRecord(userId, steps) {
  const sql = `
    INSERT INTO health_records (user_id, record_type, value, unit, record_date, created_at)
    VALUES (?, '步数', ?, '步', CURDATE(), NOW())
  `
  await recordDb.query(sql, [userId, steps])
  return true
}

module.exports = {
  getTodayExerciseTotal,
  getTodayWaterTotal,
  getTodayStepsTotal,
  addExerciseRecord,
  addWaterRecord,
  addStepsRecord
}
