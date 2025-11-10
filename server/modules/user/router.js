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

module.exports = router
