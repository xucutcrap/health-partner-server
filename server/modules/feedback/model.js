
const { database } = require('../../core')

const db = database.createDbOperations()

/**
 * 创建反馈记录
 * @param {Object} data
 * @param {string} data.content
 * @param {string} [data.contact]
 * @param {number} [data.userId]
 */
async function createFeedback(data) {
  const { content, contact, userId } = data
  const sql = `
    INSERT INTO feedback (content, contact, user_id, create_time)
    VALUES (?, ?, ?, NOW())
  `
  const result = await db.query(sql, [content, contact, userId])
  return {
    id: result.insertId,
    ...data
  }
}

module.exports = {
  createFeedback
}
