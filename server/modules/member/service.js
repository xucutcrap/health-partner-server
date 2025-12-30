/**
 * 会员服务模块
 */
const { database, errors } = require('../../core')
const userModel = require('../user/model')
const { BusinessError } = errors
const config = require('../../../config')

// 数据库操作
const orderDb = database.createDbOperations('member_orders')

// 商品列表配置
const PRODUCTS = [
  { id: 'month', name: '月度会员', price: 0.1, duration_days: 30, original_price: 19.9 },
  { id: 'quarter', name: '季度会员', price: 29.9, duration_days: 90, original_price: 59.9 },
  { id: 'year', name: '年度会员', price: 49.9, duration_days: 365, original_price: 199.9, recommend: true }
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
const pay = require('../../core/wechat')

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
  
  // 3. 调用微信统一下单接口
  let paymentParams = {}

  console.log('pay', pay)
  
  if (pay) {
    try {
      // 3.1 V3 JSAPI 下单
      const res = await pay.transactions_jsapi({
        description: `番茄控卡-${product.name}`,
        out_trade_no: orderNo,
        notify_url: config.wechat.notifyUrl, // 需在config中配置
        amount: {
          total: Math.round(product.price * 100) // 单位：分
        },
        payer: {
          openid: user.openid
        }
      })

      console.log('WeChat Order Response:', res)
      
      // 3.2 获取前端支付参数
      if (res.status === 200 && res.data) {
        // wechatpay-node-v3 已经在内部处理了 prepay_id 并返回了签名后的参数
        paymentParams = res.data
      } else {
        throw new Error('WeChat Pay Error: ' + JSON.stringify(res))
      }
    } catch (e) {
      console.error('WeChat Pay Create Order Failed:', e)
      throw BusinessError('微信下单失败，请稍后重试')
    }
  } else {
    // 未配置支付时抛出明确错误
    throw BusinessError('支付功能未开启')
  }

  return {
    orderId: result.insertId,
    orderNo,
    paymentParams
  }
}

/**
 * 支付回调处理 (或主动查询处理)
 * @param {string} orderNo 订单号
 * @param {string} transactionId 微信支付流水号
 */
async function handlePaymentSuccess(orderNo, transactionId) {
  const order = await database.queryOne('SELECT * FROM member_orders WHERE order_no = ?', [orderNo])
  if (!order) {
    throw BusinessError('订单不存在')
  }

  if (order.status === 'success') {
    return true // 已经处理过
  }

  // 1. 更新订单状态
  await database.query(
    'UPDATE member_orders SET status = ?, transaction_id = ?, paid_at = NOW() WHERE id = ?', 
    ['success', transactionId, order.id]
  )

  // 2. 更新用户会员时间
  const product = PRODUCTS.find(p => p.id === order.product_id)
  if (!product) {
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
 * 验证并处理微信支付回调
 */
async function verifyAndHandleNotification(headers, body) {
  if (!pay) {
    throw BusinessError('微信支付未初始化')
  }

  // wechatpay-node-v3 verify_notification 需要传入 headers 和 body
  // body 应该是 JSON 对象
  try {
    const result = await pay.verify_notification(headers, body)
    
    if (result.status === 'success') {
      const { out_trade_no, transaction_id } = result.resource
      await handlePaymentSuccess(out_trade_no, transaction_id)
      return true
    }
  } catch (err) {
    console.error('WeChat Notification Verify Failed:', err)
    throw BusinessError('签名验证失败')
  }
  return false
}

module.exports = {
  getProducts,
  createOrder,
  handlePaymentSuccess,
  verifyAndHandleNotification
}
