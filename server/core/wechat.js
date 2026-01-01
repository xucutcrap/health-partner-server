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
  if (WechatPay && config.wechat && config.wechat.mchId) {
    // 加载微信支付公钥/平台证书
    const certPath = path.resolve(__dirname, '../cert/wechatpay.pem')
    let wechatPayPublicKey = null
    
    if (fs.existsSync(certPath)) {
      wechatPayPublicKey = fs.readFileSync(certPath)
      console.log(`✅ 已加载微信支付证书: ${certPath}`)
    } else {
      console.warn('⚠️ 未找到证书文件:', certPath)
    }
    
    const initConfig = {
      appid: config.wechat.appId,
      mchid: config.wechat.mchId,
      publicKey: fs.readFileSync(path.resolve(config.wechat.certPath)),
      privateKey: fs.readFileSync(path.resolve(config.wechat.keyPath)),
      key: config.wechat.apiV3Key,
      notifyUrl: config.wechat.notifyUrl
    }
    
    // 3. 尝试加载平台证书 (如果存在)
    // 证书下载脚本: npm run download-cert
    if (wechatPayPublicKey) {
       console.log('📌 加载平台证书')
       initConfig.platformCert = wechatPayPublicKey
    }
    
    pay = new WechatPay(initConfig)
    console.log('✅ WeChat Pay initialized successfully.')
  } else {
    console.warn('⚠️  WeChat Pay config missing or lib not installed, skipped initialization.')
  }
} catch (err) {
  console.error('❌ WeChat Pay initialization failed:', err.message)
  console.error('   错误详情:', err.stack)
}

module.exports = pay
