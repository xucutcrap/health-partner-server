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

// 添加新路由
router.get('/latest', async (ctx) => {
  const { openId, limit = 10 } = ctx.query;
  try {
    const result = await service.getLatestMeasurements(openId, parseInt(limit));
    ctx.body = {
      code: 200,
      success: true,
      data: result
    };
  } catch (error) {
    ctx.body = {
      success: false,
      message: error.message || '获取围度记录失败'
    };
  }
});
module.exports = router
