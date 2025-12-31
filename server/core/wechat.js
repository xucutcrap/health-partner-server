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
    // 尝试加载本地平台证书
    const platformCertPaths = [
      path.resolve(__dirname, '../../cert/wechatpay.pem'),
      path.resolve(__dirname, '../../cert/platform_cert.pem'),
      path.resolve(__dirname, '../../server/cert/wechatpay.pem'),
      path.resolve(__dirname, '../../server/cert/platform_cert.pem')
    ]
    
    let platformCert = null
    for (const certPath of platformCertPaths) {
      if (fs.existsSync(certPath)) {
        platformCert = fs.readFileSync(certPath)
        console.log(`✅ 已加载本地平台证书: ${certPath}`)
        break
      }
    }
    
    if (!platformCert) {
      console.log('⚠️  未找到本地平台证书,将尝试自动从微信服务器拉取')
      console.log('   提示: 如果自动拉取失败,请手动下载平台证书并放到 cert/ 目录')
    }
    
    const initConfig = {
      appid: config.wechat.appId,
      mchid: config.wechat.mchId,
      publicKey: fs.readFileSync(path.resolve(config.wechat.certPath)),
      privateKey: fs.readFileSync(path.resolve(config.wechat.keyPath)),
      key: config.wechat.apiV3Key,
      notifyUrl: config.wechat.notifyUrl
    }
    
    // 如果有本地平台证书,添加到配置中
    if (platformCert) {
      initConfig.platformCert = platformCert
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
