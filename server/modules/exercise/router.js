/**
 * 运动模块路由
 */
const router = require('koa-router')()
const { response } = require('../../core')
const exerciseService = require('./service')

const { handle, success } = response

/**
 * POST /api/v1/exercise/recognize-text
 * 文本识别运动
 */
router.post('/recognize-text', handle(async (ctx) => {
  const { text, profile } = ctx.request.body

  if (!text) {
    return ctx.throw(400, '缺少文本内容')
  }

  const result = await exerciseService.recognizeExerciseFromText(text, profile)
  
  if (result.code !== 0) {
    return ctx.throw(500, result.message || '识别失败')
  }
  
  return success(result.data)
}))

module.exports = router
