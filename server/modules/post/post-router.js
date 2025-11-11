/**
 * 帖子路由
 */
const router = require('koa-router')()
const { response } = require('../../core')
const postService = require('./post-service')

const { handle, success } = response

/**
 * 发布帖子
 * POST /api/v1/post/create
 */
router.post('/create', handle(async (ctx) => {
  const { openId, content, images } = ctx.request.body
  if (!openId) {
    return ctx.throw(400, 'openId 不能为空')
  }
  const result = await postService.createPost(openId, { content, images })
  return success(result)
}))

/**
 * 获取帖子列表
 * GET /api/v1/post/list?page=1&pageSize=20
 */
router.get('/list', handle(async (ctx) => {
  const { page = 1, pageSize = 20 } = ctx.query
  const result = await postService.getPostList({
    page: parseInt(page),
    pageSize: parseInt(pageSize)
  })
  return success(result)
}))

/**
 * 获取用户时光轴（只返回当前用户的帖子）
 * GET /api/v1/post/timeline?openId=xxx&page=1&pageSize=20
 */
router.get('/timeline', handle(async (ctx) => {
  const { openId, page, pageSize } = ctx.query
  if (!openId) {
    return ctx.throw(400, 'openId 不能为空')
  }
  const result = await postService.getUserTimeline(openId, {
    page: parseInt(page) || 1,
    pageSize: parseInt(pageSize) || 20
  })
  return success(result)
}))

/**
 * 上传帖子图片
 * POST /api/v1/post/upload-image
 */
router.post('/upload-image', handle(async (ctx) => {
  const uploadUtil = require('../../utils/upload')
  const uploadResult = await uploadUtil.uploadPicture(ctx, { pictureType: 'post' })
  
  if (!uploadResult.success || !uploadResult.data) {
    return ctx.throw(500, '图片上传失败')
  }
  
  // 返回完整的访问 URL
  const baseUrl = ctx.request.protocol + '://' + ctx.request.host
  const imageUrl = baseUrl + uploadResult.data.url
  
  return success({
    url: imageUrl,
    path: uploadResult.data.path
  })
}))

/**
 * 删除帖子
 * DELETE /api/v1/post/:id?openId=xxx
 */
router.delete('/:id', handle(async (ctx) => {
  const { id } = ctx.params
  const { openId } = ctx.query
  if (!openId) {
    return ctx.throw(400, 'openId 不能为空')
  }
  await postService.deletePost(openId, parseInt(id))
  return success(true)
}))

module.exports = router

