/**
 * 健康体征记录数据模型
 */
const { database } = require('../../core')

const healthRecordDb = database.createDbOperations('health_records')

/**
 * 根据用户ID查询健康记录列表
 */
async function findByUserId(userId, options = {}) {
  let sql = 'SELECT * FROM health_records WHERE user_id = ?'
  const params = [userId]
  
  // 默认排除步数记录（步数记录由打卡功能单独管理）
  if (options.excludeSteps !== false) {
    sql += ' AND record_type != ?'
    params.push('步数')
  }
  
  // 支持按类型筛选
  if (options.recordType) {
    sql += ' AND record_type = ?'
    params.push(options.recordType)
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
  sql += ' ORDER BY record_date DESC, record_time DESC, created_at DESC'
  
  // 支持分页
  if (options.limit) {
    sql += ' LIMIT ?'
    params.push(options.limit)
    if (options.offset) {
      sql += ' OFFSET ?'
      params.push(options.offset)
    }
  }
  
  return await healthRecordDb.query(sql, params)
}

/**
 * 根据ID查询单条记录
 */
async function findById(id) {
  const sql = 'SELECT * FROM health_records WHERE id = ?'
  return await healthRecordDb.queryOne(sql, [id])
}

/**
 * 创建健康记录
 */
async function create(recordData) {
  const insertData = {
    user_id: recordData.userId,
    record_type: recordData.recordType,
    value: recordData.value,
    unit: recordData.unit || null,
    systolic: recordData.systolic || null,
    diastolic: recordData.diastolic || null,
    record_date: recordData.recordDate || new Date().toISOString().split('T')[0],
    record_time: recordData.recordTime || new Date().toTimeString().split(' ')[0],
    note: recordData.note || null
  }
  
  return await healthRecordDb.create(insertData)
}

/**
 * 删除健康记录
 */
async function deleteById(id, userId) {
  const sql = 'DELETE FROM health_records WHERE id = ? AND user_id = ?'
  await healthRecordDb.query(sql, [id, userId])
  return true
}

module.exports = {
  findByUserId,
  findById,
  create,
  deleteById
}

