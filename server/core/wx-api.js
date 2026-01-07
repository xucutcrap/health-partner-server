const axios = require('axios')
const NodeCache = require('node-cache')
const config = require('../../config')

class WxApi {
    constructor() {
        // AccessToken 缓存 1小时50分钟 (微信有效期2小时)
        this.cache = new NodeCache({ stdTTL: 6600 })
        this.tokenKey = 'wx_access_token'
    }

    /**
     * 获取微信 AccessToken
     */
    async getAccessToken() {
        const cachedToken = this.cache.get(this.tokenKey)
        if (cachedToken) {
            return cachedToken
        }

        const { appId, appSecret } = config.wechat
        const url = `https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=${appId}&secret=${appSecret}`

        try {
            const res = await axios.get(url)
            if (res.data.errcode) {
                console.error('Get AccessToken failed:', res.data)
                throw new Error(`Get AccessToken failed: ${res.data.errmsg}`)
            }

            const token = res.data.access_token
            this.cache.set(this.tokenKey, token)
            return token
        } catch (error) {
            console.error('WxApi getAccessToken error:', error)
            throw error
        }
    }

    /**
     * 获取小程序码 (Unlimited)
     * @param {string} scene 参数, 例如: "p=123" (p: promoterId)
     * @param {string} page 页面路径, 例如: "pages/index/index"
     * @returns {Buffer} 图片Buffer
     */
    async getUnlimitedQRCode(scene, page = 'pages/index/index') {
        const token = await this.getAccessToken()
        const url = `https://api.weixin.qq.com/wxa/getwxacodeunlimit?access_token=${token}`

        try {
            const res = await axios.post(url, {
                scene: scene,
                page: page,
                width: 430,
                auto_color: false,
                line_color: { "r": 0, "g": 0, "b": 0 },
                is_hyaline: false
            }, {
                responseType: 'arraybuffer' // 重要:以此获取图片二进制
            })

            // 微信返回错误是JSON，成功是二进制图片
            // 简单判断: 如果 header content-type 是 application/json，说明出错了
            if (res.headers['content-type'].includes('application/json')) {
                const errData = JSON.parse(res.data.toString())
                console.error('Get QRCode failed:', errData)
                throw new Error(`Get QRCode failed: ${errData.errmsg}`)
            }

            return res.data
        } catch (error) {
            console.error('WxApi getUnlimitedQRCode error:', error)
            throw error
        }
    }
}

module.exports = new WxApi()
