/**
 * 帖子评论数据模型
 */
const { database } = require('../../core')

const commentDb = database.createDbOperations('post_comments')

/**
 * 获取帖子的评论列表（两级结构）
 */
async function findByPostId(postId) {
  const sql = `
    SELECT 
      c.*,
      u.id as user_id,
      u.nickname,
      u.avatar_url,
      reply_user.nickname as reply_to_nickname
    FROM post_comments c
    LEFT JOIN users u ON c.user_id = u.id
    LEFT JOIN users reply_user ON c.reply_to_user_id = reply_user.id
    WHERE c.post_id = ?
    ORDER BY 
      COALESCE(c.parent_id, c.id) ASC,
      c.created_at ASC
  `
  const results = await commentDb.query(sql, [postId])
  
  // 处理评论结构：一级评论和二级评论
  const comments = []
  const commentMap = new Map() // 用于快速查找一级评论
  
  results.forEach(row => {
    if (!row.parent_id) {
      // 一级评论
      const comment = {
        id: row.id,
        postId: row.post_id,
        userId: row.user_id,
        nickname: row.nickname || '匿名用户',
        avatarUrl: row.avatar_url || null,
        content: row.content,
        createdAt: row.created_at,
        created_at: row.created_at, // 兼容前端
        replies: [] // 二级评论列表
      }
      comments.push(comment)
      commentMap.set(row.id, comment)
    } else {
      // 二级评论
      const parentComment = commentMap.get(row.parent_id)
      if (parentComment) {
        parentComment.replies.push({
          id: row.id,
          postId: row.post_id,
          userId: row.user_id,
          nickname: row.nickname || '匿名用户',
          avatarUrl: row.avatar_url || null,
          content: row.content,
          createdAt: row.created_at,
          created_at: row.created_at, // 兼容前端
          replyToUserId: row.reply_to_user_id,
          replyToNickname: row.reply_to_nickname || null
        })
      }
    }
  })
  
  return comments
}

/**
 * 根据ID获取评论
 */
async function findById(id) {
  const sql = `
    SELECT 
      c.*,
      u.id as user_id,
      u.nickname,
      u.avatar_url
    FROM post_comments c
    LEFT JOIN users u ON c.user_id = u.id
    WHERE c.id = ?
  `
  return await commentDb.queryOne(sql, [id])
}

/**
 * 创建评论
 */
async function create(commentData) {
  const insertData = {
    post_id: commentData.postId,
    user_id: commentData.userId,
    parent_id: commentData.parentId || null,
    reply_to_user_id: commentData.replyToUserId || null,
    content: commentData.content.trim()
  }
  
  const result = await commentDb.create(insertData)
  const commentId = result.insertId || result.id
  
  // 返回完整的评论信息（包含用户信息）
  const sql = `
    SELECT 
      c.*,
      u.id as user_id,
      u.nickname,
      u.avatar_url,
      reply_user.nickname as reply_to_nickname
    FROM post_comments c
    LEFT JOIN users u ON c.user_id = u.id
    LEFT JOIN users reply_user ON c.reply_to_user_id = reply_user.id
    WHERE c.id = ?
  `
  const comment = await commentDb.queryOne(sql, [commentId])
  
  return {
    id: comment.id,
    postId: comment.post_id,
    userId: comment.user_id,
    nickname: comment.nickname || '匿名用户',
    avatarUrl: comment.avatar_url || null,
    content: comment.content,
    createdAt: comment.created_at,
    created_at: comment.created_at,
    parentId: comment.parent_id,
    replyToUserId: comment.reply_to_user_id,
    replyToNickname: comment.reply_to_nickname || null
  }
}

/**
 * 删除评论
 */
async function deleteById(id, userId) {
  // 只能删除自己的评论
  const sql = 'DELETE FROM post_comments WHERE id = ? AND user_id = ?'
  const result = await commentDb.query(sql, [id, userId])
  return result.affectedRows > 0
}

/**
 * 获取评论数
 */
async function getCommentCount(postId) {
  const sql = 'SELECT COUNT(*) as count FROM post_comments WHERE post_id = ?'
  const result = await commentDb.queryOne(sql, [postId])
  return result ? result.count : 0
}

/**
 * 批量获取帖子评论数量
 */
async function getCommentsCount(postIds) {
  if (!postIds || postIds.length === 0) {
    return {}
  }
  
  const placeholders = postIds.map(() => '?').join(',')
  const sql = `
    SELECT post_id, COUNT(*) as count 
    FROM post_comments 
    WHERE post_id IN (${placeholders})
    GROUP BY post_id
  `
  const results = await commentDb.query(sql, postIds)
  console.log('getCommentsCount 查询结果:', results); // 调试日志
  
  // 构建结果对象
  const result = {}
  postIds.forEach(postId => {
    const data = results.find(r => r.post_id === postId)
    result[postId] = data ? Number(data.count) : 0
  })
  
  console.log('getCommentsCount 返回结果:', result); // 调试日志
  return result
}

module.exports = {
  findByPostId,
  findById,
  create,
  deleteById,
  getCommentCount,
  getCommentsCount
}

