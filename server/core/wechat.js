const fs = require('fs')
const path = require('path')
const config = require('../../config')
const WechatPay = require('wechatpay-node-v3')

/**
 * 微信支付核心实例
 * 依赖配置：config.wechat
 */
let pay = null

try {
    console.log('WechatPay:', WechatPay)
    console.log('config:', config?.wechat)
  if (WechatPay && config.wechat && config.wechat.mchId) {
    pay = new WechatPay({
      appid: config.wechat.appId,
      mchid: config.wechat.mchId,
      publicKey: fs.readFileSync(path.resolve(config.wechat.certPath)),
      privateKey: fs.readFileSync(path.resolve(config.wechat.keyPath)),
      key: config.wechat.apiV3Key,
    })
    console.log('WeChat Pay initialized successfully.')
  } else {
    console.warn('WeChat Pay config missing or lib not installed, skipped initialization.')
  }
} catch (err) {
  console.error('WeChat Pay initialization failed:', err.message)
}

module.exports = pay
