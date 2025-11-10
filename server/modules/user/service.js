/**
 * 小程序用户业务服务
 */
const { errors } = require('../../core')
const userModel = require('./model')
const profileModel = require('./profile-model')
const goalModel = require('./goal-model')
const recordModel = require('./record-model')
const healthRecordModel = require('./health-record-model')
const axios = require('axios')
const config = require('../../../config')

const { BusinessError } = errors

/**
 * 小程序：根据 code 获取 openId，并返回所有用户信息（包括健康档案）
 */
async function getOpenIdByCode(code) {
  try {
    const url = `https://api.weixin.qq.com/sns/jscode2session`
    const params = {
      appid: config.wechat.appId,
      secret: config.wechat.appSecret,
      js_code: code,
      grant_type: 'authorization_code'
    }
    
    const response = await axios.get(url, { params })
    const { openid, session_key, errcode, errmsg } = response.data
    
    if (errcode) {
      throw new BusinessError(errmsg || '获取 openId 失败')
    }
    
    if (!openid) {
      throw new BusinessError('未获取到 openId')
    }
    
    // 创建或更新用户（如果不存在则创建）
    const user = await userModel.createOrUpdateByOpenId(openid)
    
    // 跨表查询健康档案信息
    const profile = await profileModel.findByUserId(user.id)
    
    return {
      openId: openid,
      userId: user.id,
      sessionKey: session_key,
      nickname: user.nickname || null,
      avatarUrl: user.avatar_url || null,
      // 健康档案信息
      profile: profile ? {
        height: profile.height || null,
        weight: profile.weight || null,
        age: profile.age || null,
        gender: profile.gender || '男',
      } : null
    }
  } catch (error) {
    if (error.name === 'BusinessError') {
      throw error
    }
    throw new BusinessError('获取 openId 失败：' + error.message)
  }
}

/**
 * 根据 openId 获取用户信息
 */
async function getUserInfoByOpenId(openId) {
  if (!openId) {
    throw new BusinessError('openId 不能为空')
  }
  
  const user = await userModel.findByOpenId(openId)
  
  if (!user) {
    return null
  }
  
  return {
    id: user.id,
    openId: user.openid,
    nickname: user.nickname,
    avatarUrl: user.avatar_url
  }
}

/**
 * 更新用户信息（昵称、头像）
 */
async function updateUserInfo(openId, userInfo) {
  if (!openId) {
    throw new BusinessError('openId 不能为空')
  }
  
  const updateData = {}
  if (userInfo.nickname !== undefined) {
    updateData.nickname = userInfo.nickname
  }
  if (userInfo.avatarUrl !== undefined) {
    updateData.avatar_url = userInfo.avatarUrl
  }
  
  if (Object.keys(updateData).length === 0) {
    throw new BusinessError('没有需要更新的数据')
  }
  
  const user = await userModel.createOrUpdateByOpenId(openId, updateData)
  
  return {
    id: user.id,
    openId: user.openid,
    nickname: user.nickname,
    avatarUrl: user.avatar_url
  }
}

/**
 * 根据 openId 获取用户健康档案
 */
async function getUserProfile(openId) {
  if (!openId) {
    throw new BusinessError('openId 不能为空')
  }
  
  const user = await userModel.findByOpenId(openId)
  if (!user) {
    throw new BusinessError('用户不存在')
  }
  
  const profile = await profileModel.findByUserId(user.id)
  
  return {
    height: profile?.height || null,
    weight: profile?.weight || null,
    age: profile?.age || null,
    gender: profile?.gender || '男',
    bodyFat: profile?.body_fat || null
  }
}

/**
 * 更新用户健康档案
 */
async function updateUserProfile(openId, profileData) {
  if (!openId) {
    throw new BusinessError('openId 不能为空')
  }
  
  const user = await userModel.findByOpenId(openId)
  if (!user) {
    throw new BusinessError('用户不存在')
  }
  
  // 计算 BMI（后端计算，确保准确性）
  let bmi = null
  if (profileData.height && profileData.weight) {
    const heightInMeters = profileData.height / 100
    bmi = profileData.weight / (heightInMeters * heightInMeters)
  }
  
  const updateData = {
    height: profileData.height,
    weight: profileData.weight,
    age: profileData.age,
    gender: profileData.gender,
    body_fat: profileData.bodyFat || null
  }
  
  const profile = await profileModel.createOrUpdateByUserId(user.id, updateData)
  
  return {
    height: profile.height,
    weight: profile.weight,
    age: profile.age,
    gender: profile.gender,
    bodyFat: profile.body_fat,
    bmi: bmi ? parseFloat(bmi.toFixed(1)) : null
  }
}

/**
 * 根据 openId 获取用户目标
 */
async function getUserGoals(openId) {
  if (!openId) {
    throw new BusinessError('openId 不能为空')
  }
  
  const user = await userModel.findByOpenId(openId)
  if (!user) {
    throw new BusinessError('用户不存在')
  }
  
  const goals = await goalModel.findByUserId(user.id)
  
  // 返回格式化的目标数据
  return {
    targetWeight: goals?.target_weight || null,
    targetExercise: goals?.target_exercise || 30,
    targetWater: goals?.target_water || 8,
    targetSteps: goals?.target_steps || 10000
  }
}

/**
 * 更新用户目标
 */
async function updateUserGoals(openId, goalData) {
  if (!openId) {
    throw new BusinessError('openId 不能为空')
  }
  
  const user = await userModel.findByOpenId(openId)
  if (!user) {
    throw new BusinessError('用户不存在')
  }
  
  const updateData = {}
  if (goalData.targetWeight !== undefined) {
    updateData.target_weight = goalData.targetWeight
  }
  if (goalData.targetExercise !== undefined) {
    updateData.target_exercise = goalData.targetExercise
  }
  if (goalData.targetWater !== undefined) {
    updateData.target_water = goalData.targetWater
  }
  if (goalData.targetSteps !== undefined) {
    updateData.target_steps = goalData.targetSteps
  }
  
  const goals = await goalModel.createOrUpdateByUserId(user.id, updateData)
  
  return {
    targetWeight: goals.target_weight || null,
    targetExercise: goals.target_exercise || 30,
    targetWater: goals.target_water || 8,
    targetSteps: goals.target_steps || 10000
  }
}

/**
 * 获取用户今日完成情况
 */
async function getTodayProgress(openId) {
  if (!openId) {
    throw new BusinessError('openId 不能为空')
  }
  
  const user = await userModel.findByOpenId(openId)
  if (!user) {
    throw new BusinessError('用户不存在')
  }
  
  // 获取今日完成情况
  const todayExercise = await recordModel.getTodayExerciseTotal(user.id)
  const todayWater = await recordModel.getTodayWaterTotal(user.id)
  const todaySteps = await recordModel.getTodayStepsTotal(user.id)
  
  // 获取用户目标
  const goals = await goalModel.findByUserId(user.id)
  
  return {
    exercise: {
      completed: todayExercise,
      target: goals?.target_exercise || 30
    },
    water: {
      completed: todayWater,
      target: goals?.target_water || 8
    },
    steps: {
      completed: todaySteps,
      target: goals?.target_steps || 10000
    }
  }
}

/**
 * 快速打卡（添加记录）
 */
async function quickCheckIn(openId, type, value) {
  if (!openId) {
    throw new BusinessError('openId 不能为空')
  }
  
  const user = await userModel.findByOpenId(openId)
  if (!user) {
    throw new BusinessError('用户不存在')
  }
  
  if (type === 'exercise') {
    await recordModel.addExerciseRecord(user.id, parseInt(value))
  } else if (type === 'water') {
    await recordModel.addWaterRecord(user.id, parseInt(value))
  } else if (type === 'steps') {
    await recordModel.addStepsRecord(user.id, parseInt(value))
  } else {
    throw new BusinessError('不支持的打卡类型')
  }
  
  // 返回更新后的今日完成情况
  return await getTodayProgress(openId)
}

/**
 * 获取用户健康记录列表
 */
async function getHealthRecords(openId, options = {}) {
  if (!openId) {
    throw new BusinessError('openId 不能为空')
  }
  
  const user = await userModel.findByOpenId(openId)
  if (!user) {
    throw new BusinessError('用户不存在')
  }
  
  const records = await healthRecordModel.findByUserId(user.id, options)
  
  // 格式化返回数据
  return records.map(record => ({
    id: record.id,
    type: record.record_type,
    value: parseFloat(record.value),
    unit: record.unit || '',
    systolic: record.systolic || null,
    diastolic: record.diastolic || null,
    date: record.record_date,
    time: record.record_time || '',
    note: record.note || '',
    createdAt: record.created_at
  }))
}

/**
 * 添加健康记录
 */
async function addHealthRecord(openId, recordData) {
  if (!openId) {
    throw new BusinessError('openId 不能为空')
  }
  
  const user = await userModel.findByOpenId(openId)
  if (!user) {
    throw new BusinessError('用户不存在')
  }
  
  if (!recordData.recordType || recordData.value === undefined) {
    throw new BusinessError('记录类型和数值不能为空')
  }
  
  // 根据记录类型设置单位
  const unitMap = {
    '血压': 'mmHg',
    '心率': 'bpm',
    '体重': 'kg',
    '血糖': 'mmol/L',
    '体温': '℃'
  }
  
  const insertData = {
    userId: user.id,
    recordType: recordData.recordType,
    value: parseFloat(recordData.value),
    unit: recordData.unit || unitMap[recordData.recordType] || '',
    systolic: recordData.systolic || null,
    diastolic: recordData.diastolic || null,
    recordDate: recordData.recordDate || new Date().toISOString().split('T')[0],
    recordTime: recordData.recordTime || new Date().toTimeString().split(' ')[0],
    note: recordData.note || null
  }
  
  const newRecord = await healthRecordModel.create(insertData)
  
  return {
    id: newRecord.id,
    type: newRecord.record_type,
    value: parseFloat(newRecord.value),
    unit: newRecord.unit || '',
    date: newRecord.record_date,
    time: newRecord.record_time || '',
    note: newRecord.note || ''
  }
}

/**
 * 删除健康记录
 */
async function deleteHealthRecord(openId, recordId) {
  if (!openId) {
    throw new BusinessError('openId 不能为空')
  }
  
  if (!recordId) {
    throw new BusinessError('记录ID不能为空')
  }
  
  const user = await userModel.findByOpenId(openId)
  if (!user) {
    throw new BusinessError('用户不存在')
  }
  
  // 验证记录是否属于该用户
  const record = await healthRecordModel.findById(recordId)
  if (!record) {
    throw new BusinessError('记录不存在')
  }
  
  if (record.user_id !== user.id) {
    throw new BusinessError('无权删除该记录')
  }
  
  await healthRecordModel.deleteById(recordId, user.id)
  return true
}

module.exports = {
  getOpenIdByCode,
  getUserInfoByOpenId,
  updateUserInfo,
  getUserProfile,
  updateUserProfile,
  getUserGoals,
  updateUserGoals,
  getTodayProgress,
  quickCheckIn,
  getHealthRecords,
  addHealthRecord,
  deleteHealthRecord
}
