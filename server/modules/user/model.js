/**
 * 小程序用户数据模型
 */
const { database } = require('../../core')

// 创建用户表的数据库操作函数
const userDb = database.createDbOperations('users')

/**
 * 根据 openId 查找用户
 */
async function findByOpenId(openId) {
  const sql = 'SELECT * FROM users WHERE openid = ?'
  return await userDb.queryOne(sql, [openId])
}

/**
 * 根据 openId 创建或更新用户信息
 */
async function createOrUpdateByOpenId(openId, userData = {}) {
  const existingUser = await findByOpenId(openId)
  
  if (existingUser) {
    // 更新用户信息
    const updateFields = []
    const updateValues = []
    
    if (userData.nickname !== undefined) {
      updateFields.push('nickname = ?')
      updateValues.push(userData.nickname)
    }
    if (userData.avatar_url !== undefined) {
      updateFields.push('avatar_url = ?')
      updateValues.push(userData.avatar_url)
    }
    
    if (updateFields.length > 0) {
      updateValues.push(openId)
      const sql = `UPDATE users SET ${updateFields.join(', ')}, updated_at = NOW() WHERE openid = ?`
      await userDb.query(sql, updateValues)
      return await findByOpenId(openId)
    }
    
    return existingUser
  } else {
    // 创建新用户
    const insertData = {
      openid: openId,
      nickname: userData.nickname || null,
      avatar_url: userData.avatar_url || null
    }
    await userDb.create(insertData)
    return await findByOpenId(openId)
  }
}

module.exports = {
  findByOpenId,
  createOrUpdateByOpenId
}
