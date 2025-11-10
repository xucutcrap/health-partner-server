/**
 * 食物单位数据模型
 */
const { database } = require('../../core')

const unitDb = database.createDbOperations('food_units')

/**
 * 根据食物ID查询单位列表
 */
async function findByFoodId(foodId) {
  const sql = 'SELECT * FROM food_units WHERE food_id = ? ORDER BY sort_order ASC, id ASC'
  return await unitDb.query(sql, [foodId])
}

/**
 * 根据ID查询单位
 */
async function findById(id) {
  const sql = 'SELECT * FROM food_units WHERE id = ?'
  return await unitDb.queryOne(sql, [id])
}

module.exports = {
  findByFoodId,
  findById
}

