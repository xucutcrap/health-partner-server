/**
 * 小程序用户路由 - 专为小程序端用户相关接口
 */
const router = require('koa-router')()
const { response, errors, Middleware } = require('../../core')
const userService = require('./service')

const { handle, success } = response
const jwtAuth = Middleware.jwtAuth('mini-program')

/**
 * 获取当前用户信息
 * GET /api/v1/users/me
 */
router.get('/me', jwtAuth, handle(async (ctx) => {
  const userId = ctx.state.userId
  const result = await userService.getUserInfo(userId)
  return success(result)
}))

module.exports = router
