/**
 * 函数式数据库操作工具
 */
const mysql = require('mysql')
const config = require('../../config')

// 数据库连接池 - 映射配置字段名
const pool = mysql.createPool({
  host: config.database.HOST,
  user: config.database.USERNAME,
  password: config.database.PASSWORD,
  database: config.database.DATABASE,
  port: config.database.PORT,
  charset: 'utf8mb4',
  connectionLimit: 10
})

// 确保连接使用正确的字符集
pool.on('connection', (connection) => {
  connection.query('SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci')
})

/**
 * 基础查询函数
 */
const query = (sql, params = []) => 
  new Promise((resolve, reject) => {
    pool.query(sql, params, (error, results) => {
      if (error) {
        console.error('Database Error:', error)
        reject(error)
      } else {
        resolve(results)
      }
    })
  })

/**
 * 查询单条记录
 */
const queryOne = async (sql, params = []) => {
  const results = await query(sql, params)
  return results[0] || null
}

/**
 * 构建 WHERE 子句 - 纯函数
 */
const buildWhereClause = (conditions) => {
  const keys = Object.keys(conditions)
  if (keys.length === 0) {
    return { sql: '', params: [] }
  }
  
  const whereConditions = keys.map(key => `${key} = ?`)
  const sql = `WHERE ${whereConditions.join(' AND ')}`
  const params = Object.values(conditions)
  
  return { sql, params }
}

/**
 * 分页参数处理 - 纯函数
 */
const getPagination = (page = 1, size = 10) => {
  page = Math.max(1, parseInt(page))
  size = Math.min(100, Math.max(1, parseInt(size)))
  const offset = (page - 1) * size
  
  return { page, size, offset }
}

/**
 * 创建数据库操作函数的工厂函数 - 高阶函数
 */
const createDbOperations = (tableName) => {
  
  // 创建记录
  const create = async (data) => {
    const fields = Object.keys(data)
    const values = Object.values(data)
    const placeholders = fields.map(() => '?').join(', ')
    
    const sql = `INSERT INTO ${tableName} (${fields.join(', ')}) VALUES (${placeholders})`
    return await query(sql, values)
  }

  // 根据ID查找
  const findById = async (id) => {
    const sql = `SELECT * FROM ${tableName} WHERE id = ?`
    return await queryOne(sql, [id])
  }

  // 根据条件查找单条
  const findOne = async (conditions = {}) => {
    const { sql: whereClause, params } = buildWhereClause(conditions)
    const sql = `SELECT * FROM ${tableName} ${whereClause} LIMIT 1`
    return await queryOne(sql, params)
  }

  // 根据条件查找多条
  const findMany = async (conditions = {}) => {
    const { sql: whereClause, params } = buildWhereClause(conditions)
    const sql = `SELECT * FROM ${tableName} ${whereClause}`
    return await query(sql, params)
  }

  // 分页查询
  const findPage = async ({ conditions = {}, offset = 0, limit = 10, orderBy = 'id DESC' }) => {
    const { sql: whereClause, params } = buildWhereClause(conditions)
    
    // 查询总数
    const countSql = `SELECT COUNT(*) as total FROM ${tableName} ${whereClause}`
    const countResult = await queryOne(countSql, params)
    const total = countResult.total
    
    // 查询数据
    const dataSql = `SELECT * FROM ${tableName} ${whereClause} ORDER BY ${orderBy} LIMIT ? OFFSET ?`
    const list = await query(dataSql, [...params, limit, offset])
    
    return { list, total }
  }

  // 更新记录
  const update = async (id, data) => {
    const fields = Object.keys(data)
    const values = Object.values(data)
    const setClause = fields.map(field => `${field} = ?`).join(', ')
    
    const sql = `UPDATE ${tableName} SET ${setClause} WHERE id = ?`
    return await query(sql, [...values, id])
  }

  // 删除记录
  const remove = async (id) => {
    const sql = `DELETE FROM ${tableName} WHERE id = ?`
    return await query(sql, [id])
  }

  return {
    create,
    findById,
    findOne,
    findMany,
    findPage,
    update,
    remove,
    // 暴露原始查询方法供自定义使用
    query: (sql, params) => query(sql, params),
    queryOne: (sql, params) => queryOne(sql, params)
  }
}

module.exports = {
  query,
  queryOne,
  buildWhereClause,
  createDbOperations,
  getPagination
}
