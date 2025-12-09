/**
 * 身体围度路由
 */
const service = require('./service')
const Router = require('koa-router')
const router = new Router()

// 保存围度记录
router.post('/save', async (ctx) => {
  const { openId, date, type, value } = ctx.request.body
  const result = await service.saveMeasurement(openId, { date, type, value })
  ctx.body = result
})

// 获取今日围度数据
router.get('/daily', async (ctx) => {
  const { openId, date } = ctx.query
  const data = await service.getDailyMeasurements(openId, date)
  ctx.body = data
})

// 获取列表 (用于周历或其他图表)
router.get('/list', async (ctx) => {
  const { openId, startDate, endDate } = ctx.query
  const data = await service.getMeasurements(openId, startDate, endDate)
  ctx.body = data
})

// 删除围度记录
router.post('/delete', async (ctx) => {
  const { openId, date, type } = ctx.request.body
  const result = await service.deleteMeasurement(openId, date, type)
  ctx.body = result
})

module.exports = router
