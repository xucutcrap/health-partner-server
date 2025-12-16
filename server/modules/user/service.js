/**
 * 小程序用户业务服务
 */
const { errors } = require('../../core')
const userModel = require('./model')
const profileModel = require('./profile-model')
const goalModel = require('./goal-model')
const recordModel = require('./record-model')
const healthRecordModel = require('./health-record-model')
const exerciseModel = require('./exercise-model')
const dietModel = require('./diet-model')
const shareModel = require('./share-model')
const foodService = require('../food/service')
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
      profile: !!profile
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
  
  // 获取最近一次体重记录（代替档案中的体重）
  const latestWeightRecord = await healthRecordModel.findByUserId(user.id, {
    recordType: 'weight',
    limit: 1
  })
  
  // 如果有体重记录，使用最新记录；否则使用档案体重
  const currentWeight = (latestWeightRecord && latestWeightRecord.length > 0) 
    ? parseFloat(latestWeightRecord[0].value) 
    : (profile?.weight || null)

  return {
    height: profile?.height || null,
    weight: currentWeight,
    originalWeight: profile?.weight || null,
    age: profile?.age || null,
    gender: profile?.gender || '男'
  }
}

/**
 * 更新用户健康档案
 */
/**
 * 更新用户健康档案
 */
async function updateUserProfile(openId, profileData, referrerId = null, channel = null) {
  if (!openId) {
    throw new BusinessError('openId 不能为空')
  }
  
  const user = await userModel.findByOpenId(openId)
  if (!user) {
    throw new BusinessError('用户不存在')
  }
  
  // 计算 BMI(后端计算,确保准确性)
  let bmi = null
  if (profileData.height && profileData.weight) {
    const heightInMeters = profileData.height / 100
    bmi = profileData.weight / (heightInMeters * heightInMeters)
  }
  
  const updateData = {
    height: profileData.height,
    weight: profileData.weight,
    age: profileData.age,
    gender: profileData.gender
  }
  
  const profile = await profileModel.createOrUpdateByUserId(user.id, updateData)
  
  // 处理推荐关系
  if (referrerId || channel) {
    try {
      if (referrerId && referrerId !== openId) {
        // 有推荐人的情况：用户分享
        const referrerUser = await userModel.findByOpenId(referrerId)
        if (referrerUser) {
           // 查找最近的分享记录作为归因
           let shareId = await shareModel.getLatestShareIdByUserId(referrerUser.id)
           // 如果找不到分享记录,创建一个系统补录的分享记录
           if (!shareId) {
             const newShare = await shareModel.createShareRecord(referrerUser.id, 1, 'system_auto')
             shareId = newShare.id
           }
           
           // 创建推荐记录,传入渠道参数
           await shareModel.createReferralRecord(shareId, user.id, channel)
        }
      } else if (!referrerId && channel) {
        // 只有渠道没有推荐人的情况：官方渠道推广
        // shareId 为 null 表示官方渠道，无具体分享人
        await shareModel.createReferralRecord(null, user.id, channel)
      }
    } catch (err) {
      console.error('Process referral error:', err)
      // 推荐记录失败不应影响主流程
    }
  }
  
  return {
    height: profile.height,
    originalWeight: profile.weight,
    age: profile.age,
    gender: profile.gender,
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
  if (goalData.targetSteps !== undefined) {
    updateData.target_steps = goalData.targetSteps
  }
  if (goalData.targetCalories !== undefined) {
    updateData.target_calories = goalData.targetCalories
  }
  if (goalData.targetCaloriesBurned !== undefined) {
    updateData.target_calories_burned = goalData.targetCaloriesBurned
  }
  if (goalData.targetCaloriesRestDay !== undefined) {
    updateData.target_calories_rest_day = goalData.targetCaloriesRestDay
  }
  if (goalData.targetCaloriesExerciseDay !== undefined) {
    updateData.target_calories_exercise_day = goalData.targetCaloriesExerciseDay
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
    targetSteps: goals.target_steps || 10000,
    targetCalories: goals.target_calories || 2000,
    targetCaloriesBurned: goals.target_calories_burned || 500,
    targetCaloriesRestDay: goals.target_calories_rest_day || null,
    targetCaloriesExerciseDay: goals.target_calories_exercise_day || null,
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
  const todaySteps = await recordModel.getTodayStepsTotal(user.id)
  
  // 获取用户目标
  const goals = await goalModel.findByUserId(user.id)
  
  return {
    exercise: {
      completed: todayExercise,
      target: goals?.target_exercise || 30
    },
    steps: {
      completed: todaySteps,
      target: goals?.target_steps || 10000
    }
  }
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
 * 判断运动类型是否需要距离
 */
function needsDistance(exerciseType) {
  return ['跑步', '骑行'].includes(exerciseType)
}

/**
 * 获取运动记录列表
 */
async function getExerciseRecords(openId, options = {}) {
  if (!openId) {
    throw new BusinessError('openId 不能为空')
  }
  
  const user = await userModel.findByOpenId(openId)
  if (!user) {
    throw new BusinessError('用户不存在')
  }
  
  const records = await exerciseModel.findByUserId(user.id, options)
  
  // 计算总消耗和总时长
  const totalDuration = records.reduce((sum, r) => sum + (r.duration || 0), 0)
  const totalCalories = records.reduce((sum, r) => sum + (r.calories || 0), 0)

  // 格式化返回数据
  const list = records.map(record => ({
    id: record.id,
    exerciseId: record.exercise_id,
    exerciseType: record.exercise_type,
    icon: record.exercise_icon || '🔥',
    duration: record.duration,
    calories: record.calories,
    recordDate: record.record_date,
  }))

  return {
    list,
    totalDuration,
    totalCalories
  }
}

/**
 * 获取今日运动统计
 */
async function getTodayExerciseStats(openId) {
  if (!openId) {
    throw new BusinessError('openId 不能为空')
  }
  
  const user = await userModel.findByOpenId(openId)
  if (!user) {
    throw new BusinessError('用户不存在')
  }
  
  const stats = await exerciseModel.getTodayStats(user.id)
  
  return {
    totalDuration: stats.totalDuration || 0,
    totalCalories: stats.totalCalories || 0,
    totalDistance: stats.totalDistance ? parseFloat(stats.totalDistance) : 0
  }
}

/**
 * 获取本周运动记录
 */
async function getWeekExerciseRecords(openId) {
  if (!openId) {
    throw new BusinessError('openId 不能为空')
  }
  
  const user = await userModel.findByOpenId(openId)
  if (!user) {
    throw new BusinessError('用户不存在')
  }
  
  const records = await exerciseModel.getWeekRecords(user.id)
  
  // 格式化返回数据
  return records.map(record => ({
    id: record.id,
    exerciseType: record.exercise_type,
    duration: record.duration,
    calories: record.calories,
    distance: record.distance ? parseFloat(record.distance) : null,
    recordDate: record.record_date,
    createdAt: record.created_at
  }))
}

/**
 * 添加运动记录
 */
async function addExerciseRecord(openId, recordData) {
  if (!openId) {
    throw new BusinessError('openId 不能为空')
  }

  const { exerciseType, duration, distance, caloriesPerMinute, exerciseId, icon } = recordData

  if (!exerciseType || !duration) {
    throw new BusinessError('运动类型和时长不能为空')
  }

  const user = await userModel.findByOpenId(openId)
  if (!user) {
    throw new BusinessError('用户不存在')
  }

  // 自动计算卡路里（支持前端传入卡路里参数）
  const calories = recordData.calories || caloriesPerMinute * duration

  const result = await exerciseModel.create({
    userId: user.id,
    exerciseId,
    exerciseType,
    icon,
    duration: parseInt(duration),
    calories,
    distance: distance ? parseFloat(distance) : null,
    recordDate: recordData.recordDate || new Date().toISOString().split('T')[0]
  })

  return {
    id: result.insertId || result.id,
    exerciseType,
    duration: parseInt(duration),
    calories,
    distance: distance ? parseFloat(distance) : null
  }
}

/**
 * 删除运动记录
 */
async function deleteExerciseRecord(openId, recordId) {
  if (!openId || !recordId) {
    throw new BusinessError('openId 和 recordId 不能为空')
  }
  
  const user = await userModel.findByOpenId(openId)
  if (!user) {
    throw new BusinessError('用户不存在')
  }
  
  const record = await exerciseModel.findById(recordId)
  if (!record) {
    throw new BusinessError('记录不存在')
  }
  
  if (record.user_id !== user.id) {
    throw new BusinessError('无权删除该记录')
  }
  
  await exerciseModel.deleteById(recordId, user.id)
  return true
}

/**
 * 获取饮食记录列表
 */
async function getDietRecords(openId, options = {}) {
  if (!openId) {
    throw new BusinessError('openId 不能为空')
  }
  
  const user = await userModel.findByOpenId(openId)
  if (!user) {
    throw new BusinessError('用户不存在')
  }
  
  const records = await dietModel.findByUserId(user.id, options)
  
  // 获取食物模型以查询图标
  const foodModel = require('../food/food-model')
  
  // 格式化返回数据，关联查询食物图标
  const formattedRecords = await Promise.all(records.map(async (record) => {
    return {
      id: record.id,
      mealType: record.meal_type,
      foodName: record.food_name,
      calories: record.calories,
      protein: parseFloat(record.protein || 0),
      carbs: parseFloat(record.carbs || 0),
      fat: parseFloat(record.fat || 0),
      recordDate: record.record_date
    }
  }))
  
  return formattedRecords
}

/**
 * 添加饮食记录（支持自动计算卡路里）
 */
async function addDietRecord(openId, recordData) {
  if (!openId) {
    throw new BusinessError('openId 不能为空')
  }
  
  const user = await userModel.findByOpenId(openId)
  if (!user) {
    throw new BusinessError('用户不存在')
  }
  
  const result = await dietModel.create({
    userId: user.id,
    ...recordData
  })
  
  return true
}

/**
 * 删除饮食记录
 */
async function deleteDietRecord(openId, recordId) {
  if (!openId || !recordId) {
    throw new BusinessError('openId 和 recordId 不能为空')
  }
  
  const user = await userModel.findByOpenId(openId)
  if (!user) {
    throw new BusinessError('用户不存在')
  }
  
  const record = await dietModel.findById(recordId)
  if (!record) {
    throw new BusinessError('记录不存在')
  }
  
  if (record.user_id !== user.id) {
    throw new BusinessError('无权删除该记录')
  }
  
  await dietModel.deleteById(recordId, user.id)
  return true
}

/**
 * 获取今日饮食统计
 */
async function getTodayDietStats(openId) {
  if (!openId) {
    throw new BusinessError('openId 不能为空')
  }
  
  const user = await userModel.findByOpenId(openId)
  if (!user) {
    throw new BusinessError('用户不存在')
  }
  
  const stats = await dietModel.getTodayStats(user.id)
  
  return {
    totalCalories: stats.totalCalories || 0,
    totalProtein: parseFloat(stats.totalProtein || 0),
    totalCarbs: parseFloat(stats.totalCarbs || 0),
    totalFat: parseFloat(stats.totalFat || 0),
    totalFiber: parseFloat(stats.totalFiber || 0)
  }
}

/**
 * 获取用户统计数据
 */
async function getUserStats(openId) {
  if (!openId) {
    throw new BusinessError('openId 不能为空')
  }
  
  const user = await userModel.findByOpenId(openId)
  if (!user) {
    throw new BusinessError('用户不存在')
  }
  
  const { database } = require('../../core')
  const db = database.createDbOperations()
  
  // 1. 统计饮食记录总数
  const dietCountResult = await db.queryOne(
    'SELECT COUNT(*) as count FROM diet_records WHERE user_id = ?',
    [user.id]
  )
  const dietRecords = dietCountResult?.count || 0
  
  // 2. 统计运动记录总数
  const exerciseCountResult = await db.queryOne(
    'SELECT COUNT(*) as count FROM exercise_records WHERE user_id = ?',
    [user.id]
  )
  const exerciseRecords = exerciseCountResult?.count || 0
  
  // 3. 统计健康记录总数（排除步数）
  const healthCountResult = await db.queryOne(
    'SELECT COUNT(*) as count FROM health_records WHERE user_id = ? AND record_type != ?',
    [user.id, '步数']
  )
  const healthRecords = healthCountResult?.count || 0
  
  // 4. 计算坚持天数：从首次记录到现在的天数
  // 找出所有记录表中的最早记录日期
  const firstDietDate = await db.queryOne(
    'SELECT MIN(record_date) as first_date FROM diet_records WHERE user_id = ?',
    [user.id]
  )
  const firstExerciseDate = await db.queryOne(
    'SELECT MIN(record_date) as first_date FROM exercise_records WHERE user_id = ?',
    [user.id]
  )
  const firstHealthDate = await db.queryOne(
    'SELECT MIN(record_date) as first_date FROM health_records WHERE user_id = ? AND record_type != ?',
    [user.id, '步数']
  )
  
  // 找出最早的记录日期
  const dates = [
    firstDietDate?.first_date,
    firstExerciseDate?.first_date,
    firstHealthDate?.first_date
  ].filter(date => date !== null)
  
  let totalDays = 0
  if (dates.length > 0) {
    // 查询所有有记录的日期（去重）
    const dietDates = await db.query(
      'SELECT DISTINCT record_date FROM diet_records WHERE user_id = ?',
      [user.id]
    )
    const exerciseDates = await db.query(
      'SELECT DISTINCT record_date FROM exercise_records WHERE user_id = ?',
      [user.id]
    )
    const healthDates = await db.query(
      'SELECT DISTINCT record_date FROM health_records WHERE user_id = ? AND record_type != ?',
      [user.id, '步数']
    )
    
    // 合并所有日期并去重
    const allDates = new Set()
    dietDates.forEach(row => {
      if (row.record_date) {
        const dateStr = row.record_date instanceof Date 
          ? row.record_date.toISOString().split('T')[0]
          : row.record_date.toString().split('T')[0]
        allDates.add(dateStr)
      }
    })
    exerciseDates.forEach(row => {
      if (row.record_date) {
        const dateStr = row.record_date instanceof Date 
          ? row.record_date.toISOString().split('T')[0]
          : row.record_date.toString().split('T')[0]
        allDates.add(dateStr)
      }
    })
    healthDates.forEach(row => {
      if (row.record_date) {
        const dateStr = row.record_date instanceof Date 
          ? row.record_date.toISOString().split('T')[0]
          : row.record_date.toString().split('T')[0]
        allDates.add(dateStr)
      }
    })
    
    // 计算天数：从首次记录日期到今天，每天有记录就加一天
    totalDays = allDates.size
  }
  
  return {
    totalDays,
    dietRecords,
    exerciseRecords,
    healthRecords
  }
}


/**
 * 记录用户分享行为
 * @param {string} openId 
 * @param {number} scene 1:好友, 2:朋友圈
 * @param {string} page 
 */
async function recordShare(openId, scene = 1, page = 'pages/index/index') {
  if (!openId) {
    throw new BusinessError('openId 不能为空')
  }

  const user = await userModel.findByOpenId(openId)
  if (!user) {
    throw new BusinessError('用户不存在')
  }

  const result = await shareModel.createShareRecord(user.id, scene, page)
  return result
}

/**
 * 获取用户分享状态（用于判定是否解锁功能）
 * @param {string} openId 
 */
async function getUserShareStatus(openId) {
    if (!openId) {
      throw new BusinessError('openId 不能为空')
    }
  
    const user = await userModel.findByOpenId(openId)
    // 如果用户不存在，可能刚进来，默认未解锁
    if (!user) {
      return { hasShared: false, count: 0 }
    }
  
    const count = await shareModel.getShareCount(user.id)
    return {
      hasShared: count > 0,
      count: count
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
  getHealthRecords,
  addHealthRecord,
  deleteHealthRecord,
  getExerciseRecords,
  getTodayExerciseStats,
  getWeekExerciseRecords,
  addExerciseRecord,
  deleteExerciseRecord,
  needsDistance,
  getDietRecords,
  addDietRecord,
  deleteDietRecord,
  getTodayDietStats,
  getUserStats,
  recordShare,
  getUserShareStatus
}
