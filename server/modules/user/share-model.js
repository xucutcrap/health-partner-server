/**
 * 用户分享与推荐数据模型
 */
const { database } = require('../../core')

const shareDb = database.createDbOperations()

/**
 * 创建分享记录
 * @param {number} userId - 用户ID
 * @param {number} scene - 分享场景：1-好友，2-朋友圈
 * @param {string} page - 分享页面路径
 */
async function createShareRecord(userId, scene, page) {
  const sql = `
    INSERT INTO user_shares (user_id, share_scene, share_page, created_at)
    VALUES (?, ?, ?, NOW())
  `
  const result = await shareDb.query(sql, [userId, scene, page])
  return {
    id: result.insertId,
    userId,
    scene,
    page
  }
}

/**
 * 获取用户总分享次数
 * @param {number} userId - 用户ID
 */
async function getShareCount(userId) {
  const sql = `
    SELECT COUNT(*) as count FROM user_shares WHERE user_id = ?
  `
  const result = await shareDb.queryOne(sql, [userId])
  return result ? result.count : 0
}

/**
 * 创建推荐记录（新用户通过分享注册）
 * @param {number} shareId - 分享记录ID (user_shares.id)
 * @param {number} referredUserId - 被推荐人ID (users.id)
 */
async function createReferralRecord(shareId, referredUserId) {
  // 检查是否已经记录过（防止重复）
  const checkSql = `
    SELECT id FROM share_referrals WHERE referred_user_id = ?
  `
  const existing = await shareDb.queryOne(checkSql, [referredUserId])
  
  if (existing) {
    return null // 已经记录过
  }
  
  const sql = `
    INSERT INTO share_referrals (share_id, referred_user_id, created_at)
    VALUES (?, ?, NOW())
  `
  const result = await shareDb.query(sql, [shareId, referredUserId])
  return {
    id: result.insertId,
    shareId,
    referredUserId
  }
}

/**
 * 根据 shareId 获取分享记录详情
 * @param {number} shareId 
 */
async function getShareRecordById(shareId) {
  const sql = `
    SELECT * FROM user_shares WHERE id = ?
  `
  return await shareDb.queryOne(sql, [shareId])
}

/**
 * 获取最近一条分享记录ID（用于简单归因，如果只传了推荐人ID而没传具体shareId）
 * 注意：这种方式不精确，仅作为兜底
 * @param {number} referrerUserId - 推荐人用户ID
 */
async function getLatestShareIdByUserId(referrerUserId) {
  const sql = `
    SELECT id FROM user_shares 
    WHERE user_id = ? 
    ORDER BY created_at DESC 
    LIMIT 1
  `
  const result = await shareDb.queryOne(sql, [referrerUserId])
  return result ? result.id : null
}

module.exports = {
  createShareRecord,
  getShareCount,
  createReferralRecord,
  getShareRecordById,
  getLatestShareIdByUserId
}
