/**
 * 会员服务模块
 */
const { database, errors } = require('../../core')
const userModel = require('../user/model')
const { BusinessError } = errors
const config = require('../../../config')
const axios = require('axios')
const crypto = require('crypto')
const xml2js = require('xml2js')

// 数据库操作
const orderDb = database.createDbOperations('member_orders')

// 商品列表配置
const PRODUCTS = [
  { id: 'month', name: '月度会员', price: 9.9, duration_days: 30, original_price: 19.9 },
  { id: 'quarter', name: '季度会员', price: 25.0, duration_days: 90, original_price: 59.9 },
  { id: 'year', name: '年度会员', price: 88.0, duration_days: 365, original_price: 199.9, recommend: true }
]

/**
 * 获取会员商品列表
 */
async function getProducts() {
  return PRODUCTS
}

/**
 * 创建会员订单
 */
async function createOrder(userId, productId, clientIp) {
  const product = PRODUCTS.find(p => p.id === productId)
  if (!product) {
    throw BusinessError('无效的商品ID')
  }

  const user = await database.queryOne('SELECT * FROM users WHERE id = ?', [userId])
  if (!user) {
    throw BusinessError('用户不存在')
  }

  // 1. 生成系统订单号
  const orderNo = `M${Date.now()}${userId.toString().padStart(6, '0')}`

  // 2. 创建本地订单
  const orderData = {
    user_id: userId,
    order_no: orderNo,
    product_id: productId,
    product_name: product.name,
    amount: product.price,
    status: 'pending'
  }
  const result = await orderDb.create(orderData)
  
  // 3. 调用微信统一下单接口 (Mock或真实)
  // 这里暂时为了演示，如果未配置微信支付，则直接返回模拟参数
  // 实际必须配置 config.wechat.mchId 等
  let paymentParams = {}
  
  if (config.wechat && config.wechat.mchId) {
    paymentParams = await callWechatUnifiedOrder(user.openid, orderNo, product.price, clientIp)
  } else {
    // 模拟环境: 返回直接能调起支付的假参数，或者前端直接跳过支付
    console.warn('未配置微信支付，使用模拟参数')
    paymentParams = {
      timeStamp: Math.floor(Date.now() / 1000).toString(),
      nonceStr: Math.random().toString(36).substr(2, 15),
      package: `prepay_id=mock_${orderNo}`,
      signType: 'MD5',
      paySign: 'mock_sign',
      orderNo: orderNo // 返回给前端用于轮询或测试
    }
  }

  return {
    orderId: result.insertId,
    orderNo,
    paymentParams
  }
}

/**
 * 调用微信统一下单 (简化版示意)
 */
async function callWechatUnifiedOrder(openid, orderNo, price, ip) {
  // 实际开发需引入 wechat-pay 库或自行封装签名逻辑
  // 这里仅占位
  return {
      // ...
  }
}

/**
 * 支付回调处理 (或主动查询处理)
 * @param {string} orderNo 订单号
 * @param {string} transactionId 微信支付流水号
 */
async function handlePaymentSuccess(orderNo, transactionId) {
  const order = await orderDb.queryOne('SELECT * FROM member_orders WHERE order_no = ?', [orderNo])
  if (!order) {
    throw BusinessError('订单不存在')
  }

  if (order.status === 'success') {
    return true // 已经处理过
  }

  // 1. 更新订单状态
  await orderDb.query(
    'UPDATE member_orders SET status = ?, transaction_id = ?, paid_at = NOW() WHERE id = ?', 
    ['success', transactionId, order.id]
  )

  // 2. 更新用户会员时间
  const product = PRODUCTS.find(p => p.id === order.product_id)
  if (!product) {
     // 理论不应发生，除非配置改了
     console.error('Product not found for order:', order)
     return
  }

  const user = await database.queryOne('SELECT * FROM users WHERE id = ?', [order.user_id])
  let newExpireAt;
  const now = new Date()
  
  // 如果用户当前也是会员且未过期，则在原基础顺延
  if (user.member_expire_at && new Date(user.member_expire_at) > now) {
    newExpireAt = new Date(user.member_expire_at)
  } else {
    newExpireAt = new Date(now)
  }
  
  // 增加天数
  newExpireAt.setDate(newExpireAt.getDate() + product.duration_days)
  
  // 更新到 users 表
  await database.query('UPDATE users SET member_expire_at = ? WHERE id = ?', [newExpireAt, user.id])
  
  return true
}

/**
 * 模拟支付成功 (仅用于测试)
 */
async function mockPay(orderNo) {
    return await handlePaymentSuccess(orderNo, 'mock_trans_' + Date.now())
}

module.exports = {
  getProducts,
  createOrder,
  handlePaymentSuccess,
  mockPay
}
