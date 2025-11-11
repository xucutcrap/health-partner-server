/**
 * 用户健康档案数据模型
 */
const { database } = require('../../core')

// 创建用户健康档案表的数据库操作函数
const profileDb = database.createDbOperations('user_profiles')

/**
 * 根据用户ID查找健康档案
 */
async function findByUserId(userId) {
  const sql = 'SELECT * FROM user_profiles WHERE user_id = ?'
  return await profileDb.queryOne(sql, [userId])
}

/**
 * 创建或更新用户健康档案
 */
async function createOrUpdateByUserId(userId, profileData) {
  const existingProfile = await findByUserId(userId)
  
  if (existingProfile) {
    // 更新健康档案
    const updateFields = []
    const updateValues = []
    
    if (profileData.height !== undefined) {
      updateFields.push('height = ?')
      updateValues.push(profileData.height)
    }
    if (profileData.weight !== undefined) {
      updateFields.push('weight = ?')
      updateValues.push(profileData.weight)
    }
    if (profileData.age !== undefined) {
      updateFields.push('age = ?')
      updateValues.push(profileData.age)
    }
    if (profileData.gender !== undefined) {
      updateFields.push('gender = ?')
      updateValues.push(profileData.gender)
    }
    
    if (updateFields.length > 0) {
      updateValues.push(userId)
      const sql = `UPDATE user_profiles SET ${updateFields.join(', ')}, updated_at = NOW() WHERE user_id = ?`
      await profileDb.query(sql, updateValues)
      return await findByUserId(userId)
    }
    
    return existingProfile
  } else {
    // 创建新健康档案
    const insertData = {
      user_id: userId,
      height: profileData.height || null,
      weight: profileData.weight || null,
      age: profileData.age || null,
      gender: profileData.gender || '男'
    }
    await profileDb.create(insertData)
    return await findByUserId(userId)
  }
}

module.exports = {
  findByUserId,
  createOrUpdateByUserId
}

