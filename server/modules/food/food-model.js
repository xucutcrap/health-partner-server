/**
 * 食物数据模型
 */
const { database } = require('../../core')

const foodDb = database.createDbOperations('foods')

/**
 * 根据分类ID查询食物列表
 */
async function findByCategoryId(categoryId) {
  const sql = 'SELECT * FROM foods WHERE category_id = ? ORDER BY sort_order ASC, id ASC'
  return await foodDb.query(sql, [categoryId])
}

/**
 * 根据ID查询食物
 */
async function findById(id) {
  const sql = 'SELECT * FROM foods WHERE id = ?'
  return await foodDb.queryOne(sql, [id])
}

/**
 * 根据名称精确查找食物
 */
async function findByName(name) {
  const sql = 'SELECT * FROM foods WHERE name = ? LIMIT 1'
  return await foodDb.queryOne(sql, [name])
}

/**
 * 搜索食物（按名称模糊匹配）
 */
async function searchByName(keyword) {
  const sql = 'SELECT * FROM foods WHERE name LIKE ? ORDER BY sort_order ASC, id ASC LIMIT 20'
  return await foodDb.query(sql, [`%${keyword}%`])
}

module.exports = {
  findByCategoryId,
  findById,
  findByName,
  searchByName
}

