/**
 * 路由总入口
 * 整合所有模块路由
 */
const router = require('koa-router')()

// 引入用户模块路由
const userRouter = require('../modules/user').router
// 引入食物模块路由
const foodRouter = require('../modules/food/router')

// API路由 (v1版本)
router.use('/api/v1/user', userRouter.routes(), userRouter.allowedMethods())
router.use('/api/v1/food', foodRouter.routes(), foodRouter.allowedMethods())

// 健康检查接口
router.get('/health', async (ctx) => {
  ctx.body = {
    success: true,
    message: 'Server is running',
    timestamp: Date.now()
  }
})

// 根路径
router.get('/', async (ctx) => {
  ctx.body = {
    success: true,
    message: 'Welcome to Yoga Server API',
    version: '1.0.0',
    timestamp: Date.now()
  }
})

module.exports = router
