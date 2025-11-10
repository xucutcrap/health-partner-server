/**
 * 函数式用户数据模型
 */
const { database } = require('../../core')

// 创建用户表的数据库操作函数
const userDb = database.createDbOperations('users')

/**
 * 根据用户名查找用户
 */
const findByUsername = async (username) => {
  const sql = 'SELECT * FROM users WHERE username = ?'
  return await userDb.queryOne(sql, [username])
}

/**
 * 根据邮箱查找用户
 */
const findByEmail = async (email) => {
  const sql = 'SELECT * FROM users WHERE email = ?'
  return await userDb.queryOne(sql, [email])
}

/**
 * 检查用户名或邮箱是否已存在
 */
const checkExist = async (username, email, excludeId = null) => {
  let sql = 'SELECT id, username, email FROM users WHERE (username = ? OR email = ?)'
  const params = [username, email]
  
  if (excludeId) {
    sql += ' AND id != ?'
    params.push(excludeId)
  }
  
  return await userDb.queryOne(sql, params)
}

/**
 * 更新用户最后登录时间
 */
const updateLastLogin = async (userId) => {
  const sql = 'UPDATE users SET last_login_time = NOW() WHERE id = ?'
  return await userDb.query(sql, [userId])
}

/**
 * 用户列表查询（管理后台用）
 */
const findUserList = async ({ keyword, status, offset = 0, limit = 10 }) => {
  let whereClause = 'WHERE 1=1'
  const params = []

  if (keyword) {
    whereClause += ' AND (username LIKE ? OR email LIKE ? OR nickname LIKE ?)'
    const keywordPattern = `%${keyword}%`
    params.push(keywordPattern, keywordPattern, keywordPattern)
  }

  if (status !== undefined) {
    whereClause += ' AND status = ?'
    params.push(status)
  }

  // 查询总数
  const countSql = `SELECT COUNT(*) as total FROM users ${whereClause}`
  const countResult = await userDb.queryOne(countSql, params)
  const total = countResult.total

  // 查询数据，隐藏敏感字段
  const dataSql = `
    SELECT id, username, email, nickname, avatar, status, 
           create_time, update_time, last_login_time
    FROM users 
    ${whereClause} 
    ORDER BY create_time DESC 
    LIMIT ? OFFSET ?
  `
  const list = await userDb.query(dataSql, [...params, limit, offset])

  return { list, total }
}

// 导出所有用户模型函数
module.exports = {
  // 基础CRUD操作
  ...userDb,
  
  // 自定义查询函数
  findByUsername,
  findByEmail,
  checkExist,
  updateLastLogin,
  findUserList
}
