/**
 * 帖子点赞数据模型
 */
const { database } = require('../../core')

const likeDb = database.createDbOperations('post_likes')

/**
 * 检查用户是否已点赞
 */
async function isLiked(postId, userId) {
  const sql = 'SELECT * FROM post_likes WHERE post_id = ? AND user_id = ?'
  const result = await likeDb.queryOne(sql, [postId, userId])
  return !!result
}

/**
 * 添加点赞
 */
async function addLike(postId, userId) {
  // 先检查是否已点赞
  const existing = await isLiked(postId, userId)
  if (existing) {
    return false // 已点赞，不重复添加
  }
  
  await likeDb.create({
    post_id: postId,
    user_id: userId
  })
  return true
}

/**
 * 取消点赞
 */
async function removeLike(postId, userId) {
  const sql = 'DELETE FROM post_likes WHERE post_id = ? AND user_id = ?'
  const result = await likeDb.query(sql, [postId, userId])
  return result.affectedRows > 0
}

/**
 * 获取帖子点赞数
 */
async function getLikeCount(postId) {
  const sql = 'SELECT COUNT(*) as count FROM post_likes WHERE post_id = ?'
  const result = await likeDb.queryOne(sql, [postId])
  return result ? result.count : 0
}

/**
 * 批量获取帖子点赞数和用户点赞状态
 */
async function getLikesInfo(postIds, userId) {
  if (!postIds || postIds.length === 0) {
    return {}
  }
  
  // 获取所有帖子的点赞数
  const placeholders = postIds.map(() => '?').join(',')
  const countSql = `
    SELECT post_id, COUNT(*) as count 
    FROM post_likes 
    WHERE post_id IN (${placeholders})
    GROUP BY post_id
  `
  const counts = await likeDb.query(countSql, postIds)
  
  // 获取用户点赞状态
  const likeStatusSql = `
    SELECT post_id 
    FROM post_likes 
    WHERE post_id IN (${placeholders}) AND user_id = ?
  `
  const likedPosts = await likeDb.query(likeStatusSql, [...postIds, userId])
  
  // 构建结果
  const result = {}
  postIds.forEach(postId => {
    const countData = counts.find(c => c.post_id === postId)
    const isLiked = likedPosts.some(l => l.post_id === postId)
    result[postId] = {
      count: countData ? countData.count : 0,
      isLiked: isLiked || false
    }
  })
  
  return result
}

module.exports = {
  isLiked,
  addLike,
  removeLike,
  getLikeCount,
  getLikesInfo
}



