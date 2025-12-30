const router = require('koa-router')()
const { response } = require('../../core')
const memberService = require('./service')

const { handle, success } = response

/**
 * 获取会员商品列表
 * GET /api/v1/member/products
 */
router.get('/products', handle(async (ctx) => {
  const result = await memberService.getProducts()
  return success(result)
}))

/**
 * 创建会员订单
 * POST /api/v1/member/orders
 */
router.post('/orders', handle(async (ctx) => {
  const { productId, openId } = ctx.request.body
  
  if (!openId || !productId) {
    return ctx.throw(400, '参数不完整')
  }
  
  // 从openId获取userId
  const userModel = require('../user/model')
  const user = await userModel.findByOpenId(openId)
  if (!user) {
    return ctx.throw(400, '用户不存在')
  }
  
  const clientIp = ctx.ip || '127.0.0.1'
  
  const result = await memberService.createOrder(user.id, productId, clientIp)
  return success(result)
}))



/**
 * 微信支付回调通知
 * POST /api/v1/member/notification
 */
router.post('/notification', async (ctx) => {
  // 注意：回调需要返回特定的格式给微信，所以这里不用 handle/success 包装
  try {
    const headers = ctx.headers
    const body = ctx.request.body
    
    await memberService.verifyAndHandleNotification(headers, body)
    
    ctx.status = 200
    ctx.body = { code: 'SUCCESS', message: '成功' }
  } catch (err) {
    console.error('Notify Error:', err)
    ctx.status = 500
    ctx.body = { code: 'FAIL', message: err.message || '处理失败' }
  }
})

module.exports = router
