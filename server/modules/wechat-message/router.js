const Router = require('koa-router')
const router = new Router()
const service = require('./service')
const config = require('../../../config')
const crypto = require('crypto')

/**
 * 微信服务器验证接口 (GET)
 * 用于在小程序后台配置消息推送时进行 Token 验证
 */
router.get('/', async (ctx) => {
  try {
    const { signature, timestamp, nonce, echostr } = ctx.query
    const token = config.message.token

    // 1. 将 token, timestamp, nonce 三个参数进行字典序排序
    const arr = [token, timestamp, nonce].sort()
    
    // 2. 将三个参数字符串拼接成一个字符串进行 sha1 加密
    const str = arr.join('')
    const sha1Str = crypto.createHash('sha1').update(str).digest('hex')

    // 3. 开发者获得加密后的字符串可与 signature 对比
    if (sha1Str === signature) {
      // 验证成功，返回 echostr (纯文本)
      ctx.body = echostr
    } else {
      // 验证失败
      ctx.status = 403
      ctx.body = 'Verification failed'
    }
  } catch (error) {
    console.error('WeChat verification error:', error)
    ctx.status = 500
    ctx.body = 'Internal Server Error'
  }
})

/**
 * 接收微信消息推送 (POST)
 */
router.post('/', async (ctx) => {
  try {
    // 立即返回 success，避免微信重试
    const message = ctx.request.body
    
    // 异步处理消息
    service.handleMessage(message).catch(err => {
        console.error('Handle WeChat message error:', err)
    })

    ctx.body = 'success'
  } catch (err) {
    console.error('Receive WeChat message error:', err)
    ctx.status = 500
    ctx.body = 'error'
  }
})

module.exports = router
