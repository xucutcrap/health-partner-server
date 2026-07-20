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
  { id: 'month', name: '月度会员', price: config.pricing.month, duration_days: 31, original_price: 19.9 },
  { id: 'quarter', name: '季度会员', price: config.pricing.quarter, duration_days: 92, original_price: 59.9 },
  { id: 'year', name: '年度会员', price: config.pricing.year, duration_days: 366, original_price: 199.9, recommend: true },
  {
    id: 'year_special',
    name: '限时特惠年卡',
    price: config.pricing.year_special,        
    duration_days: 366,
    original_price: 199.9,
    refund_amount: config.pricing.year_special_refund, 
    is_special: true,                            // 标记限时特惠
    checkin_days_required: 30                    // 打卡30天可退款
  }
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

  // 0. 防止重复下单：检查30分钟内是否有相同商品的待支付订单
  const recentPendingOrder = await database.queryOne(
    `SELECT * FROM member_orders 
     WHERE user_id = ? 
     AND product_id = ? 
     AND status = 'pending' 
     AND created_at > DATE_SUB(NOW(), INTERVAL 30 MINUTE)
     ORDER BY created_at DESC 
     LIMIT 1`,
    [userId, productId]
  )

  if (recentPendingOrder) {
    console.log('⚠️ 发现30分钟内的待支付订单，返回已有订单:', recentPendingOrder.order_no)
    
    // 解析已有的支付参数
    let paymentParams = {}
    if (recentPendingOrder.payment_params) {
      try {
        paymentParams = JSON.parse(recentPendingOrder.payment_params)
      } catch (e) {
        console.error('解析支付参数失败:', e)
      }
    }

    return {
      orderId: recentPendingOrder.id,
      orderNo: recentPendingOrder.order_no,
      paymentParams
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
async function handlePaymentSuccess(orderNo, transactionId, paidAmount = null) {
  console.log(`🔍 查询订单: ${orderNo}`)
  const order = await database.queryOne('SELECT * FROM member_orders WHERE order_no = ?', [orderNo])
  if (!order) {
    console.error(`❌ 订单不存在: ${orderNo}`)
    throw BusinessError('订单不存在')
  }

  console.log(`📋 订单状态: ${order.status}, 订单金额: ¥${order.amount}`)
  
  // 金额校验（如果回调提供了金额）
  if (paidAmount !== null) {
    const expectedAmount = Math.round(order.amount * 100) // 转为分
    if (paidAmount !== expectedAmount) {
      console.error(`❌ 支付金额不匹配! 预期: ${expectedAmount}分, 实际: ${paidAmount}分`)
      throw BusinessError('支付金额不匹配')
    }
    console.log(`✅ 金额校验通过: ${paidAmount}分`)
  }
  
  if (order.status === 'success') {
    console.log('⚠️ 订单已处理过,跳过')
    return true // 已经处理过
  }

  // 1. 更新订单状态（使用乐观锁保证幂等性）
  console.log('💾 更新订单状态为 success...')
  const updateResult = await database.query(
    'UPDATE member_orders SET status = ?, transaction_id = ?, paid_at = NOW() WHERE id = ? AND status = ?', 
    ['success', transactionId, order.id, 'pending']
  )
  
  if (updateResult.affectedRows === 0) {
    console.log('⚠️ 订单状态未更新（可能已被其他请求处理），跳过后续逻辑')
    return true
  }
  console.log('✅ 订单状态已更新')

  // 2. 更新用户会员时间
  const product = PRODUCTS.find(p => p.id === order.product_id)
  if (!product) {
     console.error('❌ 商品不存在:', order.product_id)
     return
  }

  console.log(`📦 商品信息: ${product.name}, 天数: ${product.duration_days}`)
  
  const user = await database.queryOne('SELECT * FROM users WHERE id = ?', [order.user_id])
  console.log(`👤 用户 ID: ${user.id}, 当前会员到期时间: ${user.member_expire_at}`)
  
  let newExpireAt;
  const now = new Date()
  
  // 如果用户当前也是会员且未过期,则在原基础顺延
  if (user.member_expire_at && new Date(user.member_expire_at) > now) {
    newExpireAt = new Date(user.member_expire_at)
    console.log('📅 在原会员基础上顺延')
  } else {
    newExpireAt = new Date(now)
    console.log('📅 从现在开始计算')
  }
  
  // 增加天数
  newExpireAt.setDate(newExpireAt.getDate() + product.duration_days)
  console.log(`📅 新的会员到期时间: ${newExpireAt.toISOString()}`)
  
  // 更新到 users 表
  await database.query('UPDATE users SET member_expire_at = ? WHERE id = ?', [newExpireAt, user.id])
  console.log('✅ 用户会员时间已更新')

  // [限时特惠] 如果是 year_special 套餐，创建打卡承诺记录
  if (product.id === 'year_special') {
    try {
      const existingCommitment = await database.queryOne(
        'SELECT id FROM checkin_commitments WHERE order_id = ?', [order.id]
      )
      if (!existingCommitment) {
        await database.query(
          `INSERT INTO checkin_commitments (user_id, order_id, start_date, refund_amount, status)
           VALUES (?, ?, CURDATE(), ?, 'ongoing')`,
          [order.user_id, order.id, product.refund_amount]
        )
        console.log(`⭐ 已为用户 ${order.user_id} 创建30天打卡承诺，返款 ¥${product.refund_amount}`)
      }
    } catch (err) {
      console.error('❌ 创建打卡承诺失败:', err)
      // 不影响主流程
    }
  }
  
  // ---------------------------------------------------------
  // [NEW] 此处处理合伙人提成逻辑 (10元佣金)
  // ---------------------------------------------------------
  try {
      // 1. 查找此用户是否有上级合伙人
      // 如果没有专门的方法查 referral，直接查表
      // share_referrals: id, share_id, referred_user_id
      // user_shares: id, user_id (promoter)
      
      const referralSql = `
        SELECT us.user_id as promoterId 
        FROM share_referrals sr
        JOIN user_shares us ON sr.share_id = us.id
        WHERE sr.referred_user_id = ?
        LIMIT 1
      `
      const referral = await database.queryOne(referralSql, [order.user_id])
      
      if (referral && referral.promoterId) {
          const promoterId = referral.promoterId
          console.log(`💰 发现上级推广员 ID: ${promoterId}, 准备发放佣金...`)
          
          // 2. 发放 10 元佣金
          // 检查是否已发过（防止重复回调导致重复发钱）-> 简单检查 order_id
          const existingCommission = await database.queryOne(
              'SELECT id FROM partner_earnings WHERE order_id = ? AND type = ?', 
              [order.id, 'commission_sale']
          )
          
          if (!existingCommission) {
              const commissionAmount = 10.00
              await database.query(
                  `INSERT INTO partner_earnings (promoter_id, amount, type, source_user_id, order_id) 
                   VALUES (?, ?, ?, ?, ?)`,
                  [promoterId, commissionAmount, 'commission_sale', order.user_id, order.id]
              )
              console.log(`🎉 佣金发放成功! Promoter: ${promoterId}, Amount: 10.00`)
          } else {
              console.log('⚠️ 佣金已发放过，跳过')
          }
      }
  } catch (err) {
      console.error('❌ 佣金发放失败:', err)
      // 佣金失败不单纯影响订单状态，记录错误即可
  }
  // ---------------------------------------------------------
  
  // 3. 详细日志记录
  console.log('📊 支付成功详情:', JSON.stringify({
    orderId: order.id,
    orderNo: order.order_no,
    userId: order.user_id,
    productId: order.product_id,
    productName: product.name,
    amount: order.amount,
    transactionId: transactionId,
    paidAmount: paidAmount ? `${paidAmount}分` : 'N/A',
    oldExpireAt: user.member_expire_at,
    newExpireAt: newExpireAt.toISOString(),
    timestamp: new Date().toISOString()
  }, null, 2))
  
  console.log('🎉 支付处理完成')
  return true
}

/**
 * 验证并处理微信支付回调
 */
async function verifyAndHandleNotification(headers, body) {
  console.log('📝 开始验证微信支付回调')
  
  if (!pay) {
    console.error('❌ 微信支付未初始化')
    throw BusinessError('微信支付未初始化')
  }

  console.log('✅ 微信支付实例已初始化')
  
  try {
    // 1. 从 headers 中获取签名相关信息
    const timestamp = headers['wechatpay-timestamp']
    const nonce = headers['wechatpay-nonce']
    const signature = headers['wechatpay-signature']
    const serial = headers['wechatpay-serial']
    
    console.log('📋 回调签名信息:', { 
      timestamp, 
      nonce, 
      serial, 
      signature: signature?.substring(0, 20) + '...' 
    })
    
    if (!timestamp || !nonce || !signature || !serial) {
      console.error('❌ 缺少必要的签名头信息')
      throw BusinessError('缺少签名信息')
    }
    
    // 2. 验证签名
    console.log('🔐 开始签名验证...')
    
    let isValid = false
    try {
      isValid = await pay.verifySign({
        timestamp,
        nonce,
        body,
        serial,
        signature
      })
    } catch (verifyErr) {
      console.error('❌ 签名验证过程出错:', verifyErr.message)
      throw verifyErr
    }
    
    if (!isValid) {
      console.error('❌ 签名验证失败')
      throw BusinessError('签名验证失败')
    }
    
    console.log('✅ 签名验证成功')
    
    // 3. 解密回调数据
    console.log('🔓 开始解密回调数据...')
    const { resource } = body
    
    if (!resource) {
      console.error('❌ 回调数据中缺少 resource 字段')
      console.log('完整 body:', JSON.stringify(body, null, 2))
      throw BusinessError('回调数据格式错误')
    }
    
    console.log('Resource 字段:', {
      algorithm: resource.algorithm,
      has_ciphertext: !!resource.ciphertext,
      has_nonce: !!resource.nonce,
      has_associated_data: !!resource.associated_data
    })
    
    const decryptedData = pay.decipher_gcm(
      resource.ciphertext,
      resource.associated_data,
      resource.nonce,
      config.wechat.apiV3Key
    )
    
    console.log('✅ 数据解密成功')
    console.log('解密后的数据:', JSON.stringify(decryptedData, null, 2))
    
    // 4. 处理支付成功
    if (decryptedData.trade_state === 'SUCCESS') {
      const { out_trade_no, transaction_id, amount } = decryptedData
      console.log(`📦 订单号: ${out_trade_no}, 微信流水号: ${transaction_id}, 支付金额: ${amount?.total}分`)
      console.log('🔄 开始处理支付成功逻辑...')
      
      await handlePaymentSuccess(out_trade_no, transaction_id, amount?.total)
      
      console.log('✅ 支付成功处理完成')
      return true
    } else {
      console.warn('⚠️ 支付状态不是 SUCCESS:', decryptedData.trade_state)
    }
  } catch (err) {
    console.error('❌ 微信回调处理失败:', err.message)
    console.error('错误详情:', err)
    console.error('错误堆栈:', err.stack)
    throw BusinessError('回调处理失败: ' + err.message)
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

/**
 * 查询订单状态（用于前端轮询）
 */
async function getOrderStatus(orderId) {
  const order = await database.queryOne('SELECT * FROM member_orders WHERE id = ?', [orderId])
  
  if (!order) {
    throw BusinessError('订单不存在')
  }
  
  return {
    status: order.status,
    orderId: order.id,
    orderNo: order.order_no,
    createdAt: order.created_at,
    paidAt: order.paid_at
  }
}

/**
 * 一键打卡（每天只能打一次）
 * 支持第 30 天打卡即时触发微信原子退款
 */
async function dailyCheckin(userId) {
  // 【全局拦截】: 首先校验会员服务是否在有效期内
  const user = await database.queryOne('SELECT member_expire_at FROM users WHERE id = ?', [userId])
  if (!user || !user.member_expire_at || new Date(user.member_expire_at) < new Date()) {
    return { success: false, message: '当前不在会员有效期内，无法执行打卡。如需继续挑战，请先续费会员。' }
  }

  let isNewCheckin = false;
  try {
    await database.query(
      `INSERT INTO daily_checkins (user_id, checkin_date) VALUES (?, CURDATE())`,
      [userId]
    )
    isNewCheckin = true;
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      isNewCheckin = false; // 今日已经打过卡，但在 30 天退款场景下这需要当成一次被阻断的请求再次查验一下流水
    } else {
      throw err;
    }
  }

  // 每次打卡动作（包含重复点击），都重新计算一下最新的连签状态
  const status = await getCheckinCommitmentStatus(userId);

  // 【核心防击穿退款机制】
  // 当打卡连签达到甚至超出 30 天，且这笔契约还处在没被退款核销掉的 ongoing 状态
  if (status.checkedDays >= 30 && status.status === 'ongoing' && !status.streakBroken) {
    // 1. 本地乐观锁防并发：必须带着 ongoing 的条件去改成 completed
    const updateRes = await database.query(
      "UPDATE checkin_commitments SET status = 'completed' WHERE id = ? AND status = 'ongoing'",
      [status.commitmentId]
    );

    // 如果 affectedRows 不等于 1，说明别的请求或者上一秒的连点已经把钱退走出完了，直接拦截
    if (updateRes.affectedRows === 1) {
      try {
        const pay = require('../../core/wechat');
        if (!pay) throw new Error('微信支付实例未就绪');

        // 拉取待退金额、本金和微信原流水号
        const commitmentInfo = await database.queryOne(
          'SELECT c.order_id, c.refund_amount, o.transaction_id, o.amount FROM checkin_commitments c JOIN member_orders o ON c.order_id = o.id WHERE c.id = ?',
          [status.commitmentId]
        );

        if (!commitmentInfo || !commitmentInfo.transaction_id) {
          throw new Error('未找到微信侧支付流水号，无法原路退回！');
        }

        // 调用 WeChat V3 退款网关
        const outRefundNo = `R${commitmentInfo.order_id}_${Date.now()}`;
        const refundRes = await pay.refunds({
          transaction_id: commitmentInfo.transaction_id,
          out_refund_no: outRefundNo,
          reason: '番茄控卡30天打卡挑战活动达标退还',
          amount: {
            refund: Math.round(parseFloat(commitmentInfo.refund_amount) * 100),
            total: Math.round(parseFloat(commitmentInfo.amount) * 100),
            currency: 'CNY'
          }
        });

        console.log('✅ 30天即时退款网关受理成功:', JSON.stringify(refundRes));

        // 记上退款被受理的时间戳
        await database.query("UPDATE checkin_commitments SET refunded_at = NOW() WHERE id = ?", [status.commitmentId]);
        
        return { 
          success: true, 
          message: '🏆 30日打卡挑战通关！返现已发起原路退款，1-3个工作日到账。',
          isRefunded: true
        };
      } catch (apiError) {
        console.error('❌ 即时退款网关请求失败:', apiError.message || apiError);
        // 如果钱没发出去（网络不通），必须回滚刚刚改的 completed 状态
        // 从而允许用户一会儿重新点打卡按钮重试退款
        await database.query("UPDATE checkin_commitments SET status = 'ongoing' WHERE id = ?", [status.commitmentId]);
        
        // 返回前端一个明确的重试提示
        return { 
          success: false, 
          message: '系统退款网络拥堵，打卡已记录，返现还在处理中，请重新点击打卡按钮重试。' 
        };
      }
    }
  }

  // 如果最新挑战已经完结（成功或失败），则拦截额外的打卡行为
  if (status.status === 'completed') {
    return { success: false, message: '当前挑战已成功通关，无需继续打卡' }
  }
  if (status.status === 'failed') {
    // 【新逻辑】: 断签后自动重启挑战 (有效期已在函数顶部由全局逻辑拦截)
    await database.query(
      "UPDATE checkin_commitments SET status = 'ongoing', start_date = CURDATE() WHERE id = ?",
      [status.commitmentId]
    )
    return { success: true, message: '已重新开启 30 天返现挑战，从今日起重新累计连续天数！' }
  }

  if (!isNewCheckin) {
    return { success: false, message: '今日已完成打卡' }
  }

  return { success: true, message: '打卡成功' }
}

/**
 * 查询用户的打卡承诺进度
 */
async function getCheckinCommitmentStatus(userId) {
  // 返回用户最新的挑战记录（无论 ongoing 还是 completed 还是 failed）
  // 这样前端能明确知道用户最近的挑战是什么状态
  const commitment = await database.queryOne(
    `SELECT * FROM checkin_commitments
     WHERE user_id = ?
     ORDER BY created_at DESC LIMIT 1`,
    [userId]
  )

  // 今日是否已打卡
  const todayRow = await database.queryOne(
    `SELECT id FROM daily_checkins WHERE user_id = ? AND checkin_date = CURDATE()`,
    [userId]
  )
  const todayChecked = !!todayRow

  if (!commitment) {
    return {
      checkedDays: 0,
      remainDays: 30,
      refundAmount: config.pricing.year_special_refund,
      todayChecked,
      status: 'none',
      streakBroken: false
    }
  }

  // 取所有打卡日期跑 MySQL 原生天数差（规避 Node 的 JS Date 与数据库跨时区的漂移 Bug）
  const allDates = await database.query(
    `SELECT DATEDIFF(CURDATE(), checkin_date) as diff_days 
     FROM daily_checkins
     WHERE user_id = ? AND checkin_date >= ? AND checkin_date <= CURDATE()
     ORDER BY checkin_date DESC`,
    [userId, commitment.start_date]
  )

  let streak = 0
  let streakBroken = false
  
  // 如果今天没打卡，期望第一个签到差一天 (昨天)；如果打了卡，期望差 0 天 (今天)
  let expectedDiff = todayChecked ? 0 : 1

  for (let i = 0; i < allDates.length; i++) {
    const diffDays = allDates[i].diff_days

    if (diffDays === expectedDiff) {
      streak++
      expectedDiff++
    } else {
      streakBroken = streak > 0  // 只要积累了1天以上又发生数字跳表，说明中间断了
      break
    }
  }

  // 如果今天没打卡，且第一条记录差的根本不是1天（也就是说昨天也没打卡），则连续中断
  if (!todayChecked && streak === 0 && allDates.length > 0) {
    streakBroken = true
  }

  // 【懒更新机制】如果已经断签且契约还在 ongoing，直接宣判出局，更新为 failed
  if (streakBroken && commitment.status === 'ongoing') {
    await database.query("UPDATE checkin_commitments SET status = 'failed' WHERE id = ?", [commitment.id])
    commitment.status = 'failed'
  }

  const remainDays = Math.max(0, 30 - streak)

  return {
    commitmentId: commitment.id,
    startDate: commitment.start_date,
    checkedDays: streak,       // 当前连续天数
    remainDays,
    refundAmount: parseFloat(commitment.refund_amount),
    todayChecked,
    streakBroken,              // 是否已断签
    status: commitment.status,
    isCompleted: commitment.status === 'completed' || streak >= 30,
    // [NEW] 新增：挑战已结束时的前端纯展示文案
    checkInMessage: commitment.status === 'completed'
      ? '🎉 恭喜！本次挑战已完美通关，您的自律值得赞赏！'
      : (commitment.status === 'failed' ? '连续进度已中断，可在会员有效期内从今日起重新累计。' : '')
  }
}

module.exports = {
  getProducts,
  createOrder,
  createNativeOrder,
  getJsapiParams,
  getOrderStatus,
  handlePaymentSuccess,
  verifyAndHandleNotification,
  dailyCheckin,
  getCheckinCommitmentStatus
}
