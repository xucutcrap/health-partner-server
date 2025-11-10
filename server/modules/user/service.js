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
  
  // 格式化日期为 YYYY-MM-DD
  let targetDate = null
  if (goals?.target_date) {
    const date = new Date(goals.target_date)
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    targetDate = `${year}-${month}-${day}`
  }
  
  // 返回格式化的目标数据
  return {
    targetWeight: goals?.target_weight || null,
    targetExercise: goals?.target_exercise || 30,
    targetWater: goals?.target_water || 8,
    targetSteps: goals?.target_steps || 10000,
    targetDate: targetDate
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
  if (goalData.targetCalories !== undefined) {
    updateData.target_calories = goalData.targetCalories
  }
  if (goalData.targetDate !== undefined) {
    updateData.target_date = goalData.targetDate || null
  }
  
  const goals = await goalModel.createOrUpdateByUserId(user.id, updateData)
  
  // 格式化日期为 YYYY-MM-DD
  let targetDate = null
  if (goals.target_date) {
    const date = new Date(goals.target_date)
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    targetDate = `${year}-${month}-${day}`
  }
  
  return {
    targetWeight: goals.target_weight || null,
    targetExercise: goals.target_exercise || 30,
    targetWater: goals.target_water || 8,
    targetSteps: goals.target_steps || 10000,
    targetCalories: goals.target_calories || 2000,
    targetDate: targetDate
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

/**
 * 计算理想体重范围（基于BMI 18.5-23.9）
 */
function calculateIdealWeightRange(height, gender) {
  const heightInMeters = height / 100
  // 理想 BMI 范围 18.5-23.9（中国标准）
  const minWeight = 18.5 * heightInMeters * heightInMeters
  const maxWeight = 23.9 * heightInMeters * heightInMeters
  
  return {
    min: parseFloat(minWeight.toFixed(1)),
    max: parseFloat(maxWeight.toFixed(1))
  }
}

/**
 * 计算基础代谢率 (BMR) - 使用 Mifflin-St Jeor 公式（更准确）
 */
function calculateBMR(weight, height, age, gender) {
  // Mifflin-St Jeor 公式（1990年提出，比Harris-Benedict更准确）
  // 男性: BMR = 10 × 体重(kg) + 6.25 × 身高(cm) - 5 × 年龄(岁) + 5
  // 女性: BMR = 10 × 体重(kg) + 6.25 × 身高(cm) - 5 × 年龄(岁) - 161
  let bmr = 0
  
  if (gender === '男') {
    bmr = 10 * weight + 6.25 * height - 5 * age + 5
  } else {
    bmr = 10 * weight + 6.25 * height - 5 * age - 161
  }
  
  return Math.round(bmr)
}

/**
 * 计算每日热量需求 (TDEE) - 总能量消耗
 */
function calculateTDEE(bmr, activityLevel = 1.375) {
  // 活动系数（基于每周运动频率）：
  // 1.2 - 久坐不动（很少或没有运动）
  // 1.375 - 轻度活动（每周1-3天轻度运动）
  // 1.55 - 中度活动（每周3-5天中等强度运动）
  // 1.725 - 高度活动（每周6-7天高强度运动）
  // 1.9 - 专业运动员（每天高强度运动+体力工作）
  
  return Math.round(bmr * activityLevel)
}

/**
 * 获取目标设置页面的完整数据（包括计算值）
 */
async function getGoalPageData(openId) {
  if (!openId) {
    throw new BusinessError('openId 不能为空')
  }
  
  const user = await userModel.findByOpenId(openId)
  if (!user) {
    throw new BusinessError('用户不存在')
  }
  
  // 获取用户健康档案
  const profile = await profileModel.findByUserId(user.id)
  if (!profile || !profile.height || !profile.weight) {
    throw new BusinessError('请先完善健康档案信息')
  }
  
  // 获取用户目标
  const goals = await goalModel.findByUserId(user.id)
  
  // 计算BMI
  const bmi = profile.weight / ((profile.height / 100) ** 2)
  
  // 计算理想体重范围
  const idealWeightRange = calculateIdealWeightRange(profile.height, profile.gender)
  
  // 计算基础代谢率
  const bmr = calculateBMR(profile.weight, profile.height, profile.age || 30, profile.gender)
  
  // 计算每日热量需求（默认轻度活动）
  const tdee = calculateTDEE(bmr, 1.375)
  
  // 格式化日期为 YYYY-MM-DD
  let targetDate = null
  if (goals?.target_date) {
    const date = new Date(goals.target_date)
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    targetDate = `${year}-${month}-${day}`
  }
  
  return {
    profile: {
      weight: parseFloat(profile.weight),
      height: parseFloat(profile.height),
      age: profile.age || 0,
      gender: profile.gender || '男',
      bmi: parseFloat(bmi.toFixed(1))
    },
    idealWeightRange,
    bmr,
    tdee,
    goals: {
      targetWeight: goals?.target_weight || null,
      targetExercise: goals?.target_exercise || 30,
      targetWater: goals?.target_water || 8,
      targetCalories: goals?.target_calories || tdee,
      targetSteps: goals?.target_steps || 10000,
      targetDate: targetDate
    }
  }
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
  deleteHealthRecord,
  getGoalPageData
}
