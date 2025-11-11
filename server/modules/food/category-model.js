/**
 * 食物分类数据模型
 */
const { database } = require('../../core')

const categoryDb = database.createDbOperations('food_categories')

/**
 * 获取所有分类列表（按排序）
 */
async function findAll() {
  const sql = 'SELECT * FROM food_categories ORDER BY sort_order ASC, id ASC'
  return await categoryDb.query(sql)
}

/**
 * 根据ID查询分类
 */
async function findById(id) {
  const sql = 'SELECT * FROM food_categories WHERE id = ?'
  return await categoryDb.queryOne(sql, [id])
}

module.exports = {
  findAll,
  findById
}



