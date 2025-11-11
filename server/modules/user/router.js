/**
 * 用户路由
 */
const router = require('koa-router')()
const { response } = require('../../core')
const userService = require('./service')

const { handle, success } = response

/**
 * 根据 code 获取 openId
 * POST /api/v1/user/login
 */
router.post('/login', handle(async (ctx) => {
  const { code } = ctx.request.body
  if (!code) {
    return ctx.throw(400, 'code 不能为空')
  }
  const result = await userService.getOpenIdByCode(code)
  return success(result)
}))

/**
 * 根据 openId 获取用户信息
 * GET /api/v1/user/info?openId=xxx
 */
router.get('/info', handle(async (ctx) => {
  const { openId } = ctx.query
  if (!openId) {
    return ctx.throw(400, 'openId 不能为空')
  }
  const result = await userService.getUserInfoByOpenId(openId)
  return success(result)
}))

/**
 * 上传头像
 * POST /api/v1/user/upload-avatar
 */
router.post('/upload-avatar', handle(async (ctx) => {
  const uploadUtil = require('../../utils/upload')
  const uploadResult = await uploadUtil.uploadPicture(ctx, { pictureType: 'avatar' })
  
  if (!uploadResult.success || !uploadResult.data) {
    return ctx.throw(500, '头像上传失败')
  }
  
  // 返回完整的访问 URL（需要根据实际部署情况配置）
  // 如果使用反向代理，需要检查 X-Forwarded-Proto 来获取真实的协议
  const forwardedProto = ctx.request.get('X-Forwarded-Proto')
  const protocol = forwardedProto || ctx.request.protocol || 'https'
  const baseUrl = protocol + '://' + ctx.request.host
  const avatarUrl = baseUrl + uploadResult.data.url
  
  // 调试日志（生产环境可以移除）
  console.log('上传头像 - 协议检测:', {
    'X-Forwarded-Proto': forwardedProto,
    'ctx.request.protocol': ctx.request.protocol,
    '最终使用协议': protocol,
    '返回URL': avatarUrl
  })
  
  return success({
    avatarUrl: avatarUrl,
    path: uploadResult.data.path
  })
}))

/**
 * 更新用户信息（昵称、头像）
 * POST /api/v1/user/update
 */
router.post('/update', handle(async (ctx) => {
  const { openId, nickname, avatarUrl } = ctx.request.body
  if (!openId) {
    return ctx.throw(400, 'openId 不能为空')
  }
  const result = await userService.updateUserInfo(openId, {
    nickname,
    avatarUrl
  })
  return success(result)
}))

/**
 * 获取用户健康档案
 * GET /api/v1/user/profile?openId=xxx
 */
router.get('/profile', handle(async (ctx) => {
  const { openId } = ctx.query
  if (!openId) {
    return ctx.throw(400, 'openId 不能为空')
  }
  const result = await userService.getUserProfile(openId)
  return success(result)
}))

/**
 * 更新用户健康档案
 * POST /api/v1/user/profile
 */
router.post('/profile', handle(async (ctx) => {
  const { openId, height, weight, age, gender } = ctx.request.body
  if (!openId) {
    return ctx.throw(400, 'openId 不能为空')
  }
  const result = await userService.updateUserProfile(openId, {
    height,
    weight,
    age,
    gender
  })
  return success(result)
}))

/**
 * 获取用户目标
 * GET /api/v1/user/goals?openId=xxx
 */
router.get('/goals', handle(async (ctx) => {
  const { openId } = ctx.query
  if (!openId) {
    return ctx.throw(400, 'openId 不能为空')
  }
  const result = await userService.getUserGoals(openId)
  return success(result)
}))

/**
 * 更新用户目标
 * POST /api/v1/user/goals
 */
router.post('/goals', handle(async (ctx) => {
  const { openId, targetWeight, targetExercise, targetSteps, targetCalories, targetCaloriesBurned, targetCaloriesRestDay, targetCaloriesExerciseDay, targetDate } = ctx.request.body
  if (!openId) {
    return ctx.throw(400, 'openId 不能为空')
  }
  const result = await userService.updateUserGoals(openId, {
    targetWeight,
    targetExercise,
    targetSteps,
    targetCalories,
    targetCaloriesBurned,
    targetCaloriesRestDay,
    targetCaloriesExerciseDay,
    targetDate
  })
  return success(result)
}))

/**
 * 获取今日完成情况
 * GET /api/v1/user/today-progress?openId=xxx
 */
router.get('/today-progress', handle(async (ctx) => {
  const { openId } = ctx.query
  if (!openId) {
    return ctx.throw(400, 'openId 不能为空')
  }
  const result = await userService.getTodayProgress(openId)
  return success(result)
}))

/**
 * 快速打卡
 * POST /api/v1/user/check-in
 */
router.post('/check-in', handle(async (ctx) => {
  const { openId, type, value } = ctx.request.body
  if (!openId || !type || value === undefined) {
    return ctx.throw(400, '参数不完整')
  }
  const result = await userService.quickCheckIn(openId, type, value)
  return success(result)
}))

/**
 * 获取健康记录列表
 * GET /api/v1/user/health-records?openId=xxx&recordType=xxx&limit=xxx
 */
router.get('/health-records', handle(async (ctx) => {
  const { openId, recordType, limit, offset } = ctx.query
  if (!openId) {
    return ctx.throw(400, 'openId 不能为空')
  }
  
  const options = {}
  if (recordType) options.recordType = recordType
  if (limit) options.limit = parseInt(limit)
  if (offset) options.offset = parseInt(offset)
  
  const result = await userService.getHealthRecords(openId, options)
  return success(result)
}))

/**
 * 添加健康记录
 * POST /api/v1/user/health-records
 */
router.post('/health-records', handle(async (ctx) => {
  const { openId, recordType, value, unit, systolic, diastolic, recordDate, recordTime, note } = ctx.request.body
  if (!openId || !recordType || value === undefined) {
    return ctx.throw(400, '参数不完整')
  }
  
  const result = await userService.addHealthRecord(openId, {
    recordType,
    value,
    unit,
    systolic,
    diastolic,
    recordDate,
    recordTime,
    note
  })
  return success(result)
}))

/**
 * 删除健康记录
 * DELETE /api/v1/user/health-records/:id?openId=xxx
 */
router.delete('/health-records/:id', handle(async (ctx) => {
  const { id } = ctx.params
  const { openId } = ctx.query
  if (!openId) {
    return ctx.throw(400, 'openId 不能为空')
  }
  
  await userService.deleteHealthRecord(openId, id)
  return success(null, '删除成功')
}))

/**
 * 获取目标设置页面数据（包括计算值）
 * GET /api/v1/user/goal-page-data?openId=xxx&targetWeight=xx&exerciseDuration=xx
 */
router.get('/goal-page-data', handle(async (ctx) => {
  const { openId, targetWeight, exerciseDuration } = ctx.query
  if (!openId) {
    return ctx.throw(400, 'openId 不能为空')
  }
  
  // 构建临时参数对象（如果提供了临时值）
  const tempParams = {}
  if (targetWeight !== undefined && targetWeight !== '') {
    tempParams.targetWeight = parseFloat(targetWeight)
  }
  if (exerciseDuration !== undefined && exerciseDuration !== '') {
    tempParams.exerciseDuration = parseInt(exerciseDuration)
  }
  
  const result = await userService.getGoalPageData(openId, tempParams)
  return success(result)
}))

/**
 * 获取运动记录列表
 * GET /api/v1/user/exercise-records?openId=xxx&exerciseType=xxx&startDate=xxx&endDate=xxx
 */
router.get('/exercise-records', handle(async (ctx) => {
  const { openId, exerciseType, startDate, endDate, limit, offset } = ctx.query
  if (!openId) {
    return ctx.throw(400, 'openId 不能为空')
  }
  
  const options = {}
  if (exerciseType) options.exerciseType = exerciseType
  if (startDate) options.startDate = startDate
  if (endDate) options.endDate = endDate
  if (limit) options.limit = parseInt(limit)
  if (offset) options.offset = parseInt(offset)
  
  const result = await userService.getExerciseRecords(openId, options)
  return success(result)
}))

/**
 * 获取今日运动统计
 * GET /api/v1/user/exercise-stats?openId=xxx
 */
router.get('/exercise-stats', handle(async (ctx) => {
  const { openId } = ctx.query
  if (!openId) {
    return ctx.throw(400, 'openId 不能为空')
  }
  
  const result = await userService.getTodayExerciseStats(openId)
  return success(result)
}))

/**
 * 获取本周运动记录
 * GET /api/v1/user/exercise-week?openId=xxx
 */
router.get('/exercise-week', handle(async (ctx) => {
  const { openId } = ctx.query
  if (!openId) {
    return ctx.throw(400, 'openId 不能为空')
  }
  
  const result = await userService.getWeekExerciseRecords(openId)
  return success(result)
}))

/**
 * 添加运动记录
 * POST /api/v1/user/exercise-records
 */
router.post('/exercise-records', handle(async (ctx) => {
  const { openId, exerciseType, duration, distance, recordDate } = ctx.request.body
  if (!openId || !exerciseType || !duration) {
    return ctx.throw(400, '参数不完整')
  }
  
  const result = await userService.addExerciseRecord(openId, {
    exerciseType,
    duration,
    distance,
    recordDate
  })
  return success(result)
}))

/**
 * 删除运动记录
 * DELETE /api/v1/user/exercise-records/:id?openId=xxx
 */
router.delete('/exercise-records/:id', handle(async (ctx) => {
  const { id } = ctx.params
  const { openId } = ctx.query
  if (!openId) {
    return ctx.throw(400, 'openId 不能为空')
  }
  
  await userService.deleteExerciseRecord(openId, id)
  return success(null, '删除成功')
}))

/**
 * 获取饮食记录列表
 * GET /api/v1/user/diet-records?openId=xxx&mealType=xxx&startDate=xxx&endDate=xxx
 */
router.get('/diet-records', handle(async (ctx) => {
  const { openId, mealType, startDate, endDate, limit, offset } = ctx.query
  if (!openId) {
    return ctx.throw(400, 'openId 不能为空')
  }
  
  const options = {}
  if (mealType) options.mealType = mealType
  if (startDate) options.startDate = startDate
  if (endDate) options.endDate = endDate
  if (limit) options.limit = parseInt(limit)
  if (offset) options.offset = parseInt(offset)
  
  const result = await userService.getDietRecords(openId, options)
  return success(result)
}))

/**
 * 添加饮食记录（支持自动计算卡路里）
 * POST /api/v1/user/diet-records
 * Body: {
 *   openId,
 *   mealType: '早餐',
 *   foodId: 1,        // 可选，如果提供则自动计算
 *   unitId: 2,        // 可选，如果提供foodId和unitId，自动计算
 *   customWeight: 150, // 可选，自定义重量(克)
 *   foodName: '米饭',  // 可选，如果不提供foodId则需要
 *   calories: 200,    // 可选，如果不提供foodId则需要
 *   protein, carbs, fat, fiber // 可选
 * }
 */
router.post('/diet-records', handle(async (ctx) => {
  const { openId, mealType, foodId, unitId, customWeight, foodName, calories, protein, carbs, fat, fiber, recordDate } = ctx.request.body
  if (!openId || !mealType) {
    return ctx.throw(400, 'openId 和 mealType 不能为空')
  }
  
  const result = await userService.addDietRecord(openId, {
    mealType,
    foodId,
    unitId,
    customWeight,
    foodName,
    calories,
    protein,
    carbs,
    fat,
    fiber,
    recordDate
  })
  return success(result)
}))

/**
 * 删除饮食记录
 * DELETE /api/v1/user/diet-records/:id?openId=xxx
 */
router.delete('/diet-records/:id', handle(async (ctx) => {
  const { id } = ctx.params
  const { openId } = ctx.query
  if (!openId) {
    return ctx.throw(400, 'openId 不能为空')
  }
  
  await userService.deleteDietRecord(openId, id)
  return success(null, '删除成功')
}))

/**
 * 获取今日饮食统计
 * GET /api/v1/user/diet-stats?openId=xxx
 */
router.get('/diet-stats', handle(async (ctx) => {
  const { openId } = ctx.query
  if (!openId) {
    return ctx.throw(400, 'openId 不能为空')
  }
  
  const result = await userService.getTodayDietStats(openId)
  return success(result)
}))

/**
 * 获取用户统计数据
 * GET /api/v1/user/stats?openId=xxx
 */
router.get('/stats', handle(async (ctx) => {
  const { openId } = ctx.query
  if (!openId) {
    return ctx.throw(400, 'openId 不能为空')
  }
  const result = await userService.getUserStats(openId)
  return success(result)
}))

module.exports = router
