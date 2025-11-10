/**
 * 用户路由 - 用户相关接口
 */
const router = require('koa-router')()
const { response, errors, Middleware } = require('../../core')
const userService = require('./service')

const { handle, success, page } = response
const { AuthError } = errors
const jwtAuth = Middleware.jwtAuth('mini-program')

/**
 * 用户注册
 * POST /api/v1/user/register
 */
router.post('/register', handle(async (ctx) => {
  const userData = ctx.request.body
  const result = await userService.register(userData)
  return success(result)
}))

/**
 * 用户登录
 * POST /api/v1/user/login
 */
router.post('/login', handle(async (ctx) => {
  const loginData = ctx.request.body
  const result = await userService.login(loginData)
  return success(result)
}))

/**
 * 获取当前用户信息
 * GET /api/v1/user/me
 */
router.get('/me', jwtAuth, handle(async (ctx) => {
  const userId = ctx.state.userId
  const result = await userService.getUserInfo(userId)
  return success(result)
}))

/**
 * 更新用户信息
 * PUT /api/v1/user/me
 */
router.put('/me', jwtAuth, handle(async (ctx) => {
  const userId = ctx.state.userId
  const updateData = ctx.request.body
  const result = await userService.updateUser(userId, updateData)
  return success(result)
}))

/**
 * 修改密码
 * PUT /api/v1/user/me/password
 */
router.put('/me/password', jwtAuth, handle(async (ctx) => {
  const userId = ctx.state.userId
  const passwordData = ctx.request.body
  await userService.changePassword(userId, passwordData)
  return success({ message: '密码修改成功' })
}))

/**
 * 用户列表（分页）
 * GET /api/v1/user/list
 */
router.get('/list', jwtAuth, handle(async (ctx) => {
  const options = {
    keyword: ctx.query.keyword,
    status: ctx.query.status,
    page: ctx.query.page,
    size: ctx.query.size
  }
  const result = await userService.getUserList(options)
  return page(result.list, result.total, result.page, result.size)
}))

module.exports = router
