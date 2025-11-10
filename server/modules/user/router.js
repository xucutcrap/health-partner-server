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
  const baseUrl = ctx.request.protocol + '://' + ctx.request.host
  const avatarUrl = baseUrl + uploadResult.data.url
  
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
  const { openId, height, weight, age, gender, bodyFat } = ctx.request.body
  if (!openId) {
    return ctx.throw(400, 'openId 不能为空')
  }
  const result = await userService.updateUserProfile(openId, {
    height,
    weight,
    age,
    gender,
    bodyFat
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
  const { openId, targetWeight, targetExercise, targetWater, targetSteps } = ctx.request.body
  if (!openId) {
    return ctx.throw(400, 'openId 不能为空')
  }
  const result = await userService.updateUserGoals(openId, {
    targetWeight,
    targetExercise,
    targetWater,
    targetSteps
  })
  return success(result)
}))

module.exports = router
