#!/usr/bin/env node
/**
 * 下载微信支付平台证书
 * 用于解决 "拉取平台证书失败" 的问题
 */

const https = require('https')
const fs = require('fs')
const crypto = require('crypto')
const path = require('path')

// 加载配置
const config = require('../config')

console.log('📥 开始下载微信支付平台证书...\n')

// 1. 读取商户私钥
const privateKeyPath = path.resolve(__dirname, '..', config.wechat.keyPath)
console.log(`📂 读取商户私钥: ${privateKeyPath}`)

if (!fs.existsSync(privateKeyPath)) {
  console.error(`❌ 商户私钥文件不存在: ${privateKeyPath}`)
  process.exit(1)
}

const privateKey = fs.readFileSync(privateKeyPath, 'utf8')
console.log('✅ 商户私钥读取成功\n')

// 2. 读取商户证书并获取序列号
const certPath = path.resolve(__dirname, '..', config.wechat.certPath)
console.log(`📂 读取商户证书: ${certPath}`)

if (!fs.existsSync(certPath)) {
  console.error(`❌ 商户证书文件不存在: ${certPath}`)
  process.exit(1)
}

const cert = fs.readFileSync(certPath, 'utf8')

// 获取证书序列号
let serialNo = ''
try {
  // Node.js 15.6.0+ 支持 X509Certificate
  if (crypto.X509Certificate) {
    const x509 = new crypto.X509Certificate(cert)
    serialNo = x509.serialNumber.replace(/:/g, '')
  } else {
    // 旧版本 Node.js 使用 openssl 命令
    const { execSync } = require('child_process')
    const result = execSync(`openssl x509 -in ${certPath} -noout -serial`).toString()
    serialNo = result.split('=')[1].trim().replace(/:/g, '')
  }
  console.log(`✅ 商户证书序列号: ${serialNo}\n`)
} catch (err) {
  console.error('❌ 获取证书序列号失败:', err.message)
  process.exit(1)
}

// 3. 生成签名
function generateSignature(method, url, timestamp, nonce, body) {
  const message = `${method}\n${url}\n${timestamp}\n${nonce}\n${body}\n`
  const sign = crypto.createSign('RSA-SHA256')
  sign.update(message)
  return sign.sign(privateKey, 'base64')
}

// 4. 请求平台证书列表
async function downloadCertificates() {
  const timestamp = Math.floor(Date.now() / 1000)
  const nonce = crypto.randomBytes(16).toString('hex')
  const url = '/v3/certificates'
  const method = 'GET'
  const body = ''
  
  console.log('🔐 生成请求签名...')
  const signature = generateSignature(method, url, timestamp, nonce, body)
  
  const authorization = `WECHATPAY2-SHA256-RSA2048 mchid="${config.wechat.mchId}",nonce_str="${nonce}",signature="${signature}",timestamp="${timestamp}",serial_no="${serialNo}"`
  
  console.log('📡 请求微信支付API...')
  console.log(`   URL: https://api.mch.weixin.qq.com${url}`)
  console.log(`   商户号: ${config.wechat.mchId}\n`)
  
  const options = {
    hostname: 'api.mch.weixin.qq.com',
    port: 443,
    path: url,
    method: method,
    headers: {
      'Authorization': authorization,
      'Accept': 'application/json',
      'User-Agent': 'Node.js',
      'Content-Type': 'application/json'
    }
  }
  
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = ''
      
      console.log(`📊 响应状态码: ${res.statusCode}`)
      
      res.on('data', (chunk) => { data += chunk })
      res.on('end', () => {
        if (res.statusCode === 200) {
          try {
            resolve(JSON.parse(data))
          } catch (err) {
            reject(new Error('解析响应失败: ' + err.message))
          }
        } else {
          reject(new Error(`请求失败 (${res.statusCode}): ${data}`))
        }
      })
    })
    
    req.on('error', (err) => {
      reject(new Error('网络请求失败: ' + err.message))
    })
    
    req.setTimeout(10000, () => {
      req.destroy()
      reject(new Error('请求超时'))
    })
    
    req.end()
  })
}

// 5. 解密证书
function decryptCertificate(ciphertext, associatedData, nonce) {
  try {
    const apiV3Key = config.wechat.apiV3Key
    
    // AES-256-GCM 解密
    const decipher = crypto.createDecipheriv(
      'aes-256-gcm',
      Buffer.from(apiV3Key, 'utf8'),
      Buffer.from(nonce, 'utf8')
    )
    
    decipher.setAuthTag(Buffer.from(ciphertext.slice(-16 * 2), 'hex'))
    decipher.setAAD(Buffer.from(associatedData, 'utf8'))
    
    const ciphertextBuffer = Buffer.from(ciphertext.slice(0, -16 * 2), 'base64')
    let decrypted = decipher.update(ciphertextBuffer)
    decrypted = Buffer.concat([decrypted, decipher.final()])
    
    return decrypted.toString('utf8')
  } catch (err) {
    throw new Error('解密失败: ' + err.message)
  }
}

// 6. 主流程
async function main() {
  try {
    // 下载证书列表
    const result = await downloadCertificates()
    
    if (!result.data || result.data.length === 0) {
      console.error('❌ 没有可用的平台证书')
      process.exit(1)
    }
    
    console.log(`✅ 获取到 ${result.data.length} 个平台证书\n`)
    
    // 处理每个证书
    const certDir = path.resolve(__dirname, '..', 'cert')
    if (!fs.existsSync(certDir)) {
      fs.mkdirSync(certDir, { recursive: true })
    }
    
    result.data.forEach((item, index) => {
      console.log(`📜 证书 ${index + 1}:`)
      console.log(`   序列号: ${item.serial_no}`)
      console.log(`   生效时间: ${item.effective_time}`)
      console.log(`   过期时间: ${item.expire_time}`)
      
      // 解密证书内容
      const certContent = decryptCertificate(
        item.encrypt_certificate.ciphertext,
        item.encrypt_certificate.associated_data,
        item.encrypt_certificate.nonce
      )
      
      // 保存证书
      const filename = `wechatpay_${item.serial_no}.pem`
      const filepath = path.join(certDir, filename)
      fs.writeFileSync(filepath, certContent, 'utf8')
      console.log(`   ✅ 已保存: ${filepath}\n`)
      
      // 同时保存一份为 wechatpay.pem (最新的)
      if (index === 0) {
        const mainPath = path.join(certDir, 'wechatpay.pem')
        fs.writeFileSync(mainPath, certContent, 'utf8')
        console.log(`   ✅ 已保存主证书: ${mainPath}\n`)
      }
    })
    
    console.log('🎉 平台证书下载完成!')
    console.log('\n下一步:')
    console.log('1. 将证书文件上传到服务器的 cert/ 目录')
    console.log('2. 重启服务器')
    console.log('3. 测试支付回调')
    
  } catch (err) {
    console.error('\n❌ 下载失败:', err.message)
    console.error('\n可能的原因:')
    console.error('1. 网络无法访问微信支付API')
    console.error('2. 商户号或APIv3密钥配置错误')
    console.error('3. 商户证书文件不正确')
    process.exit(1)
  }
}

main()
