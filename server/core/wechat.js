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
    
    // 根据证书内容判断是公钥模式还是平台证书模式
    if (wechatPayPublicKey) {
      const certContent = wechatPayPublicKey.toString()
      
      // 判断是否为公钥格式 (BEGIN PUBLIC KEY)
      if (certContent.includes('BEGIN PUBLIC KEY')) {
        // 公钥模式
        console.log('📌 使用微信支付公钥模式')
        initConfig.wxPayPublicKey = wechatPayPublicKey
        
        // 设置公钥ID (从config读取或使用默认值)
        if (config.wechat.wxPayPublicId) {
          initConfig.wxPayPublicId = config.wechat.wxPayPublicId
          console.log(`   公钥ID: ${config.wechat.wxPayPublicId}`)
        } else {
          console.warn('⚠️  未配置 wxPayPublicId，请在 config.js 中添加')
        }
      } else if (certContent.includes('BEGIN CERTIFICATE')) {
        // 平台证书模式
        console.log('📌 使用平台证书模式')
        initConfig.platformCert = wechatPayPublicKey
      } else {
        console.warn('⚠️  证书格式无法识别，尝试作为平台证书使用')
        initConfig.platformCert = wechatPayPublicKey
      }
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
