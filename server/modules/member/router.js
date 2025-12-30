const express = require('express')
const router = express.Router()
const memberService = require('./service')
const { responseHandler } = require('../../core')

/**
 * 获取会员商品列表
 */
router.get('/products', responseHandler(async (req, res) => {
  return await memberService.getProducts()
}))

/**
 * 创建会员订单
 */
router.post('/orders', responseHandler(async (req, res) => {
  const { productId } = req.body
  const userId = req.user.id // 假设鉴权中间件已注入 user
  const clientIp = req.ip
  
  return await memberService.createOrder(userId, productId, clientIp)
}))

/**
 * 支付回调测试 (开发环境用)
 */
router.post('/mock-pay', responseHandler(async (req, res) => {
    const { orderNo } = req.body
    return await memberService.mockPay(orderNo)
}))

module.exports = router
