/**
 * 帖子数据模型
 */
const { database } = require('../../core')

const postDb = database.createDbOperations('posts')
const postImageDb = database.createDbOperations('post_images')

/**
 * 创建帖子
 */
async function create(postData) {
  const insertData = {
    user_id: postData.userId,
    content: postData.content
  }
  const result = await postDb.create(insertData)
  const postId = result.insertId || result.id
  
  // 如果有图片，插入图片记录
  if (postData.images && postData.images.length > 0) {
    for (let i = 0; i < postData.images.length; i++) {
      await postImageDb.create({
        post_id: postId,
        image_url: postData.images[i],
        sort_order: i
      })
    }
  }
  
  return postId
}

/**
 * 根据ID查询帖子（包含用户信息和图片）
 */
async function findById(id) {
  const sql = `
    SELECT 
      p.*,
      u.id as user_id,
      u.nickname,
      u.avatar_url,
      GROUP_CONCAT(pi.image_url ORDER BY pi.sort_order SEPARATOR ',') as images
    FROM posts p
    LEFT JOIN users u ON p.user_id = u.id
    LEFT JOIN post_images pi ON p.id = pi.post_id
    WHERE p.id = ?
    GROUP BY p.id
  `
  const result = await postDb.queryOne(sql, [id])
  
  if (result) {
    result.images = result.images ? result.images.split(',') : []
  }
  
  return result
}

/**
 * 获取帖子列表（分页）
 */
async function findList(options = {}) {
  const page = options.page || 1
  const pageSize = options.pageSize || 20
  const offset = (page - 1) * pageSize
  const userId = options.userId || null
  
  let sql = `
    SELECT 
      p.*,
      u.id as user_id,
      u.nickname,
      u.avatar_url,
      GROUP_CONCAT(pi.image_url ORDER BY pi.sort_order SEPARATOR ',') as images
    FROM posts p
    LEFT JOIN users u ON p.user_id = u.id
    LEFT JOIN post_images pi ON p.id = pi.post_id
  `
  
  const params = []
  
  // 如果指定了 userId，只查询该用户的帖子
  if (userId) {
    sql += ' WHERE p.user_id = ?'
    params.push(userId)
  }
  
  sql += `
    GROUP BY p.id
    ORDER BY p.created_at DESC
    LIMIT ? OFFSET ?
  `
  
  params.push(pageSize, offset)
  
  const results = await postDb.query(sql, params)
  
  // 处理图片数组
  return results.map(row => ({
    ...row,
    images: row.images ? row.images.split(',') : []
  }))
}

/**
 * 删除帖子
 */
async function deleteById(id, userId) {
  const sql = 'DELETE FROM posts WHERE id = ? AND user_id = ?'
  const result = await postDb.query(sql, [id, userId])
  return result.affectedRows > 0
}

module.exports = {
  create,
  findById,
  findList,
  deleteById
}

