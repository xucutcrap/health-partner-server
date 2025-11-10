/**
 * 用户目标数据模型
 */
const { database } = require('../../core')

// 创建用户目标表的数据库操作函数
const goalDb = database.createDbOperations('user_goals')

/**
 * 根据用户ID查找目标
 */
async function findByUserId(userId) {
  const sql = 'SELECT * FROM user_goals WHERE user_id = ?'
  return await goalDb.queryOne(sql, [userId])
}

/**
 * 创建或更新用户目标
 */
async function createOrUpdateByUserId(userId, goalData) {
  const existingGoal = await findByUserId(userId)
  
  if (existingGoal) {
    // 更新目标
    const updateFields = []
    const updateValues = []
    
    if (goalData.target_weight !== undefined) {
      updateFields.push('target_weight = ?')
      updateValues.push(goalData.target_weight)
    }
    if (goalData.target_exercise !== undefined) {
      updateFields.push('target_exercise = ?')
      updateValues.push(goalData.target_exercise)
    }
    if (goalData.target_water !== undefined) {
      updateFields.push('target_water = ?')
      updateValues.push(goalData.target_water)
    }
    if (goalData.target_steps !== undefined) {
      updateFields.push('target_steps = ?')
      updateValues.push(goalData.target_steps)
    }
    if (goalData.target_calories !== undefined) {
      updateFields.push('target_calories = ?')
      updateValues.push(goalData.target_calories)
    }
    if (goalData.target_date !== undefined) {
      updateFields.push('target_date = ?')
      updateValues.push(goalData.target_date || null)
    }
    
    if (updateFields.length > 0) {
      updateValues.push(userId)
      const sql = `UPDATE user_goals SET ${updateFields.join(', ')}, updated_at = NOW() WHERE user_id = ?`
      await goalDb.query(sql, updateValues)
      return await findByUserId(userId)
    }
    
    return existingGoal
  } else {
    // 创建新目标
    const insertData = {
      user_id: userId,
      target_weight: goalData.target_weight || null,
      target_exercise: goalData.target_exercise || 30,
      target_water: goalData.target_water || 8,
      target_steps: goalData.target_steps || 10000,
      target_calories: goalData.target_calories || 2000,
      target_date: goalData.target_date || null
    }
    await goalDb.create(insertData)
    return await findByUserId(userId)
  }
}

module.exports = {
  findByUserId,
  createOrUpdateByUserId
}

