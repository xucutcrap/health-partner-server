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
 * 获取 JSAPI 支付参数（用于 H5 页面）
 * GET /api/v1/member/jsapi-params?orderId=xxx&openid=xxx
 */
router.get('/jsapi-params', handle(async (ctx) => {
  const { orderId, openid } = ctx.query
  
  if (!orderId || !openid) {
    return ctx.throw(400, '参数不完整')
  }
  
  const result = await memberService.getJsapiParams(orderId, openid)
  return success(result)
}))



/**
 * 微信支付回调通知
 * POST /api/v1/member/notification
 */
router.post('/notification', async (ctx) => {
  // 注意:回调需要返回特定的格式给微信,所以这里不用 handle/success 包装
  console.log('========== 微信支付回调开始 ==========')
  console.log('Headers:', JSON.stringify(ctx.headers, null, 2))
  console.log('Body:', JSON.stringify(ctx.request.body, null, 2))
  
  try {
    const headers = ctx.headers
    const body = ctx.request.body
    
    await memberService.verifyAndHandleNotification(headers, body)
    
    console.log('✅ 微信支付回调处理成功')
    ctx.status = 200
    ctx.body = { code: 'SUCCESS', message: '成功' }
  } catch (err) {
    console.error('❌ 微信支付回调处理失败:', err)
    console.error('错误堆栈:', err.stack)
    ctx.status = 500
    ctx.body = { code: 'FAIL', message: err.message || '处理失败' }
  }
  
  console.log('========== 微信支付回调结束 ==========')
})

module.exports = router
