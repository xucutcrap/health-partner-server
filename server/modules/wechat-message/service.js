/**
 * 微信消息处理服务
 */
const { database, errors } = require('../../core')
const memberService = require('../member/service')
const userModel = require('../user/model')
const qr = require('qr-image')
const axios = require('axios')
const config = require('../../../config')
const fs = require('fs')
const path = require('path')

// 简单的 AccessToken 缓存
let accessToken = ''
let tokenExpireAt = 0

async function getAccessToken() {
  const now = Date.now()
  if (accessToken && now < tokenExpireAt) {
    return accessToken
  }

  const url = `https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=${config.wechat.appId}&secret=${config.wechat.appSecret}`
  const res = await axios.get(url)
  if (res.data.access_token) {
    accessToken = res.data.access_token
    tokenExpireAt = now + (res.data.expires_in - 200) * 1000 // 提前过期
    return accessToken
  } else {
    throw new Error('Get Access Token Failed: ' + JSON.stringify(res.data))
  }
}

async function handleMessage(message) {
    console.log('Received WeChat Message:', JSON.stringify(message, null, 2))
    
    const { ToUserName, FromUserName, MsgType, Event, SessionFrom } = message
    
    // 仅处理用户进入客服会话的事件
    if (MsgType === 'event' && Event === 'user_enter_tempsession') {
        if (!SessionFrom) return

        try {
            // 1. 解析参数
            // session-from 可能是 JSON 字符串
            const params = JSON.parse(SessionFrom)
            const { productId } = params
            
            if (!productId) return

            // 2. 获取用户 ID (通过 OpenID即 FromUserName 查找)
            const user = await database.queryOne('SELECT * FROM users WHERE openid = ?', [FromUserName])
            if (!user) {
                console.error('User not found for openid:', FromUserName)
                return
            }

            // 3. 发送 "正在生成..." 提示 (可选，为了体验)
            const token = await getAccessToken()
            // await sendTextMessage(token, FromUserName, '正在为您生成支付码，请稍候...')

            // 4. 创建订单并获取链接
            const codeUrl = await memberService.createNativeOrder(user.id, productId)
            
            // 5. 生成二维码图片流
            const qrPng = qr.image(codeUrl, { type: 'png', margin: 1 })
            
            // 6. 保存为临时文件以便上传
            const tempFilePath = path.join(__dirname, `../../../../static/temp_qr_${Date.now()}.png`)
            const tempDir = path.dirname(tempFilePath)
            
            // 确保目录存在
            if (!fs.existsSync(tempDir)) {
                fs.mkdirSync(tempDir, { recursive: true })
            }
            
            const writeStream = fs.createWriteStream(tempFilePath)
            qrPng.pipe(writeStream)

            await new Promise((resolve) => writeStream.on('finish', resolve))

            // 7. 上传临时素材
            const mediaId = await uploadTempMedia(token, tempFilePath)
            
            // 8. 发送图片消息
            await sendImageMessage(token, FromUserName, mediaId)

            // 9. 清理临时文件
            fs.unlinkSync(tempFilePath)

        } catch (err) {
            console.error('Handle Temp Session Error:', err)
            // 发送错误提示
            const token = await getAccessToken()
            await sendTextMessage(token, FromUserName, '系统繁忙，请稍后重试或联系人工客服。')
        }
    }
}

async function uploadTempMedia(token, filePath) {
    const url = `https://api.weixin.qq.com/cgi-bin/media/upload?access_token=${token}&type=image`
    
    // 需要构建 form-data
    // 这里简单起见使用 axios + form-data 库，或者手动构建
    // 由于环境限制，这里假设 axios 支持 form-data (需配合 form-data 库，但 package.json 里没有)
    // 既然没有 form-data 库，我们用 busboy 是服务端的，客户端上传比较麻烦。
    // *修正*: package.json 里没有 form-data，但 Node 18+ fetch 支持 FormData。
    // 这里我们用一个简易的依赖 `axios` 上传 buffer 可能会有问题。
    // 为了稳健，我们使用 `require('form-data')` 如果有的话，没有的话...
    // 检查 package.json 发现没有 form-data。
    // *方案*: 使用 `wechatpay-node-v3` 库其实只负责支付。
    // 我们可以尝试直接安装 `form-data`，这是一个常用库。
    
    // 鉴于不能随意安装，我们尝试用 boundaries 发送 multipart/form-data
    const FormData = require('form-data'); // 需要确认是否有，通常 node 没自带。
    // 既然不能确认，我先用 `npm install form-data` 确保一下。
    // *暂缓*：先写逻辑，下一步我安装一下 form-data。
    
    const form = new FormData();
    form.append('media', fs.createReadStream(filePath));
    
    const res = await axios.post(url, form, {
        headers: form.getHeaders()
    })
    
    if (res.data.media_id) {
        return res.data.media_id
    } else {
        throw new Error('Upload Media Failed: ' + JSON.stringify(res.data))
    }
}

async function sendImageMessage(token, toUser, mediaId) {
    const url = `https://api.weixin.qq.com/cgi-bin/message/custom/send?access_token=${token}`
    const data = {
        touser: toUser,
        msgtype: 'image',
        image: {
            media_id: mediaId
        }
    }
    await axios.post(url, data)
}

async function sendTextMessage(token, toUser, content) {
    const url = `https://api.weixin.qq.com/cgi-bin/message/custom/send?access_token=${token}`
    const data = {
        touser: toUser,
        msgtype: 'text',
        text: {
            content
        }
    }
    await axios.post(url, data)
}

module.exports = {
  handleMessage
}
