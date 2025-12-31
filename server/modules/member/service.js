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

  // 0. 检查是否存在待支付的有效订单
  const existingOrder = await database.queryOne(
    'SELECT * FROM member_orders WHERE user_id = ? AND product_id = ? AND status = ? ORDER BY id DESC LIMIT 1',
    [userId, productId, 'pending']
  )

  if (existingOrder) {
    // 检查订单是否在有效期内（例如 1 小时内有效）
    const orderTime = new Date(existingOrder.created_at).getTime()
    const now = Date.now()
    if (now - orderTime < 3600 * 1000) { // 1小时有效期
      console.log('Found existing pending order:', existingOrder.order_no)
      
      let paymentParams = {}
      if (existingOrder.payment_params) {
        try {
          paymentParams = JSON.parse(existingOrder.payment_params)
        } catch (e) {
          console.error('Parse payment_params failed:', e)
        }
      }

      return {
        orderId: existingOrder.id,
        orderNo: existingOrder.order_no,
        paymentParams
      }
    }
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
        
        // 3.3 更新本地订单，保存支付参数
        await database.query(
            'UPDATE member_orders SET payment_params = ? WHERE id = ?',
            [JSON.stringify(paymentParams), result.insertId]
        )
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
 * 创建 Native 支付订单 (返回二维码链接)
 */
async function createNativeOrder(userId, productId) {
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

  // 2. 创建本地订单 (Pending)
  const orderData = {
    user_id: userId,
    order_no: orderNo,
    product_id: productId,
    product_name: product.name,
    amount: product.price,
    status: 'pending'
  }
  const result = await orderDb.create(orderData)

  if (!pay) {
    throw BusinessError('支付未配置')
  }

  try {
      // 3. 调用 Native 支付接口
      const res = await pay.transactions_native({
        description: `番茄控卡-${product.name}`,
        out_trade_no: orderNo,
        notify_url: config.wechat.notifyUrl,
        amount: {
          total: Math.round(product.price * 100)
        }
      })
      
      console.log('WeChat Native Order Response:', res)

      if (res.status === 200 && res.data && res.data.code_url) {
          // 保存参数以防万一
          await database.query(
            'UPDATE member_orders SET payment_params = ? WHERE id = ?',
            [JSON.stringify({ code_url: res.data.code_url }), result.insertId]
          )
          return res.data.code_url
      } else {
        throw new Error('WeChat Native Pay Error: ' + JSON.stringify(res))
      }
  } catch(e) {
      console.error('Native Order Failed:', e)
      throw BusinessError('获取支付链接失败')
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

/**
 * 获取 JSAPI 支付参数（用于 H5 页面）
 */
async function getJsapiParams(orderId, openid) {
  // 1. 查询订单
  const order = await database.queryOne('SELECT * FROM member_orders WHERE id = ?', [orderId])
  if (!order) {
    throw BusinessError('订单不存在')
  }

  if (order.status === 'success') {
    throw BusinessError('订单已支付')
  }

  // 2. 查询用户
  const user = await database.queryOne('SELECT * FROM users WHERE id = ?', [order.user_id])
  if (!user || user.openid !== openid) {
    throw BusinessError('用户信息不匹配')
  }

  // 3. 如果订单已有支付参数且未过期，直接返回
  if (order.payment_params) {
    try {
      const params = JSON.parse(order.payment_params)
      // 检查是否是 JSAPI 参数（有 timeStamp 字段）
      if (params.timeStamp) {
        return {
          orderNo: order.order_no,
          productName: order.product_name,
          amount: parseFloat(order.amount),
          paymentParams: params
        }
      }
    } catch (e) {
      console.error('Parse payment_params failed:', e)
    }
  }

  // 4. 重新调用微信 JSAPI 下单
  if (!pay) {
    throw BusinessError('支付未配置')
  }

  try {
    const product = PRODUCTS.find(p => p.id === order.product_id)
    
    const res = await pay.transactions_jsapi({
      description: `番茄控卡-${order.product_name}`,
      out_trade_no: order.order_no,
      notify_url: config.wechat.notifyUrl,
      amount: {
        total: Math.round(order.amount * 100)
      },
      payer: {
        openid: user.openid
      }
    })

    console.log('JSAPI Order Response:', res)

    if (res.status === 200 && res.data) {
      // 保存支付参数
      await database.query(
        'UPDATE member_orders SET payment_params = ? WHERE id = ?',
        [JSON.stringify(res.data), order.id]
      )

      return {
        orderNo: order.order_no,
        productName: order.product_name,
        amount: parseFloat(order.amount),
        paymentParams: res.data
      }
    } else {
      throw new Error('WeChat JSAPI Pay Error: ' + JSON.stringify(res))
    }
  } catch (e) {
    console.error('JSAPI Order Failed:', e)
    throw BusinessError('获取支付参数失败')
  }
}

module.exports = {
  getProducts,
  createOrder,
  createNativeOrder,
  getJsapiParams,
  handlePaymentSuccess,
  verifyAndHandleNotification
}
