/**
 * 路由总入口
 * 整合所有模块路由
 */
const router = require('koa-router')()
const { uploadPicture } = require('../utils/upload')
const { response } = require('../core')

const { success, fail } = response

// 引入用户模块路由
const userRouter = require('../modules/user').router
// 引入食物模块路由
const foodRouter = require('../modules/food/router')
// 引入帖子模块路由
const postRouter = require('../modules/post').router
// 引入运动模块路由
const exerciseRouter = require('../modules/exercise/router')
const measurementRouter = require('../modules/measurement/router')
// 引入反馈模块路由
const feedbackRouter = require('../modules/feedback/router')
// 引入食谱模块路由
const recipeRouter = require('../modules/recipe/router')
// 引入会员模块路由
const memberRouter = require('../modules/member/router')

/**
 * 图片上传接口
 * POST /api/v1/upload/image
 */

router.post('/api/v1/upload/image', async (ctx) => {
  try {
    const result = await uploadPicture(ctx, { pictureType: 'food-recognition' })
    if (result.success) {
      ctx.body = success(result.data)
    } else {
      ctx.body = fail('上传失败')
    }
  } catch (error) {
    console.error('Upload error:', error)
    ctx.body = fail('上传失败')
  }
})

// API路由 (v1版本)
router.use('/api/v1/user', userRouter.routes(), userRouter.allowedMethods())
router.use('/api/v1/food', foodRouter.routes(), foodRouter.allowedMethods())
router.use('/api/v1/post', postRouter.routes(), postRouter.allowedMethods())
router.use('/api/v1/exercise', exerciseRouter.routes(), exerciseRouter.allowedMethods())
router.use('/api/v1/measurement', measurementRouter.routes(), measurementRouter.allowedMethods())
router.use('/api/v1/feedback', feedbackRouter.routes(), feedbackRouter.allowedMethods())
router.use('/api/v1/recipe', recipeRouter.routes(), recipeRouter.allowedMethods())
router.use('/api/v1/member', memberRouter.routes(), memberRouter.allowedMethods())

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
