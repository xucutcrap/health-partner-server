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
  const { openId, content, images, nickname, avatarUrl } = ctx.request.body
  if (!openId) {
    return ctx.throw(400, 'openId 不能为空')
  }
  const result = await postService.createPost(openId, { content, images, nickname, avatarUrl })
  return success(result)
}))

/**
 * 获取功能开关
 * GET /api/v1/post/power-enable
 */
router.get('/power-enable', handle(async (ctx) => {
  const result = await postService.getPowerEnable()
  return success(result)
}))

/**
 * 获取帖子列表
 * GET /api/v1/post/list?page=1&pageSize=20&openId=xxx
 */
router.get('/list', handle(async (ctx) => {
  const { page = 1, pageSize = 20, openId } = ctx.query
  const result = await postService.getPostList({
    page: parseInt(page),
    pageSize: parseInt(pageSize),
    openId: openId || null
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
  // 如果使用反向代理，需要检查 X-Forwarded-Proto 来获取真实的协议
  const forwardedProto = ctx.request.get('X-Forwarded-Proto')
  const protocol = forwardedProto || ctx.request.protocol || 'https'
  const baseUrl = protocol + '://' + ctx.request.host
  const imageUrl = baseUrl + uploadResult.data.url
  
  // 调试日志（生产环境可以移除）
  console.log('上传帖子图片 - 协议检测:', {
    'X-Forwarded-Proto': forwardedProto,
    'ctx.request.protocol': ctx.request.protocol,
    '最终使用协议': protocol,
    '返回URL': imageUrl
  })
  
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

/**
 * 点赞/取消点赞
 * POST /api/v1/post/:id/like?openId=xxx
 */
router.post('/:id/like', handle(async (ctx) => {
  const { id } = ctx.params
  const { openId } = ctx.query
  if (!openId) {
    return ctx.throw(400, 'openId 不能为空')
  }
  const result = await postService.toggleLike(openId, parseInt(id))
  return success(result)
}))

/**
 * 获取帖子评论列表
 * GET /api/v1/post/:id/comments
 */
router.get('/:id/comments', handle(async (ctx) => {
  const { id } = ctx.params
  const result = await postService.getPostComments(parseInt(id))
  return success(result)
}))

/**
 * 添加评论
 * POST /api/v1/post/:id/comment?openId=xxx
 */
router.post('/:id/comment', handle(async (ctx) => {
  const { id } = ctx.params
  const { openId } = ctx.query
  const { content, parentId, replyToUserId } = ctx.request.body
  
  if (!openId) {
    return ctx.throw(400, 'openId 不能为空')
  }
  
  const result = await postService.addComment(openId, {
    postId: parseInt(id),
    content,
    parentId: parentId ? parseInt(parentId) : null,
    replyToUserId: replyToUserId ? parseInt(replyToUserId) : null
  })
  return success(result)
}))

/**
 * 删除评论
 * DELETE /api/v1/post/comment/:commentId?openId=xxx
 */
router.delete('/comment/:commentId', handle(async (ctx) => {
  const { commentId } = ctx.params
  const { openId } = ctx.query
  if (!openId) {
    return ctx.throw(400, 'openId 不能为空')
  }
  await postService.deleteComment(openId, parseInt(commentId))
  return success(true)
}))

module.exports = router

