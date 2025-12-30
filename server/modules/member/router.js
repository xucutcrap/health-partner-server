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
 * 支付回调测试 (开发环境用)
 * POST /api/v1/member/mock-pay
 */
router.post('/mock-pay', handle(async (ctx) => {
  const { orderNo } = ctx.request.body
  
  if (!orderNo) {
    return ctx.throw(400, '订单号不能为空')
  }
  
  const result = await memberService.mockPay(orderNo)
  return success(result, '支付成功')
}))

module.exports = router
