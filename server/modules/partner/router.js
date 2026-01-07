const router = require('koa-router')()
const partnerService = require('./service')
const { response } = require('../../core')
const { handle, success } = response

/**
 * 记录访问 (埋点)
 * POST /api/v1/partner/visit
 */
router.post('/visit', handle(async (ctx) => {
    const { referrerId, page, visitorOpenId } = ctx.request.body
    
    // 获取真实IP
    const clientIp = ctx.request.headers['x-real-ip'] || 
                     ctx.request.headers['x-forwarded-for'] || 
                     ctx.ip
    
    await partnerService.recordVisit(referrerId, page, visitorOpenId, clientIp)
    return success()
}))

/**
 * 获取合伙人统计数据
 * GET /api/v1/partner/stats
 */
router.get('/stats', handle(async (ctx) => {
    const { openId } = ctx.query
    const result = await partnerService.getStats(openId)
    return success(result)
}))

/**
 * 获取小程序码/海报
 * GET /api/v1/partner/poster
 */
router.get('/poster', handle(async (ctx) => {
    const { openId } = ctx.query
    const result = await partnerService.generatePoster(openId)
    return success(result)
}))

module.exports = router
