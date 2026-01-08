const partnerModel = require('./model')
const userModel = require('../user/model')
const errors = require('../../core/errors')

/**
 * 记录访问
 */
async function recordVisit(referrerOpenId, page, visitorOpenId, ipAddress) {
    if (!referrerOpenId) {
        return
    }
    
    // 自己点击自己的分享链接，不记录（无效数据）
    if (referrerOpenId === visitorOpenId) {
        return
    }
    
    // 查找推广员 (referrer)
    const promoter = await userModel.findByOpenId(referrerOpenId)
    if (!promoter) {
        return // 推广员不存在，忽略
    }

    // 只有合伙人才记录访问数据，避免无效数据膨胀
    if (!promoter.is_partner) {
        return // 不是合伙人，不记录访问
    }
    
    await partnerModel.recordVisit(promoter.id, page, visitorOpenId, ipAddress)
}

/**
 * 获取合伙人统计数据
 */
const fs = require('fs')
const path = require('path')
const { wxApi } = require('../../core')
const config = require('../../../config')

/**
 * 获取合伙人统计数据
 */
async function getStats(openId) {
    const user = await userModel.findByOpenId(openId)
    if (!user) {
        throw new errors.BusinessError('用户不存在')
    }
    
    // 检查是否是合伙人
    if (!user.is_partner) {
        throw new errors.BusinessError('您还不是合伙人')
    }

    const stats = await partnerModel.getPartnerStats(user.id)
    
    return stats
}

/**
 * 生成/获取推广海报
 */
async function generatePoster(openId) {
    const user = await userModel.findByOpenId(openId)
    if (!user || !user.is_partner) {
        throw new errors.BusinessError('无效的合伙人')
    }

    // 图片保存路径 (项目根目录/static/posters/)
    const fileName = `poster_${openId}.jpg`
    const relativePath = `posters/${fileName}`
    const absolutePath = path.resolve(__dirname, '../../../static', relativePath)

    // 1. 如果已存在，直接返回URL
    const domain = config.domain || `http://localhost:${config.port || 3000}`
    
    if (fs.existsSync(absolutePath)) {
        return {
            posterUrl: `${domain}/${relativePath}`
        }
    }

    // 2. 调用微信接口生成
    // scene参数: p=openid (p代表promoter)
    const scene = `p=${openid}`
    const page = 'pages/questionnaire/questionnaire' // 落地页

    try {
        const imageBuffer = await wxApi.getUnlimitedQRCode(scene, page)
        
        // 3. 保存文件
        fs.writeFileSync(absolutePath, imageBuffer)
        
        return {
            posterUrl: `${domain}/${relativePath}`
        }
    } catch (err) {
        console.error('Generate poster error:', err)
        throw new errors.BusinessError('海报生成失败')
    }
}

module.exports = {
    recordVisit,
    getStats,
    generatePoster
}
