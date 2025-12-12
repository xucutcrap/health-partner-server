
const router = require('koa-router')()
const { response } = require('../../core')
const feedbackService = require('./service')
const userService = require('../user/service')

const { handle, success } = response

/**
 * 提交反馈
 * POST /api/v1/feedback
 */
router.post('/', handle(async (ctx) => {
  const { content, contact, openId } = ctx.request.body
  
  if (!content) {
    return ctx.throw(400, '反馈内容不能为空')
  }

  let userId = null
  if (openId) {
    // 尝试获取用户ID，如果不需要强制关联用户，也可以忽略错误或查找失败
    try {
      const userInfo = await userService.getUserInfoByOpenId(openId)
      if (userInfo) {
        userId = userInfo.id
      }
    } catch (e) {
      console.error('Failed to get user info for feedback:', e)
    }
  }

  const result = await feedbackService.submitFeedback({
    content,
    contact,
    userId
  })
  
  return success(result, '感谢您的反馈')
}))

module.exports = router
