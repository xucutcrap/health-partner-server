/**
 * 食物路由
 */
const router = require('koa-router')()
const { response } = require('../../core')
const foodService = require('./service')

const { handle, success } = response

/**
 * 计算营养信息
 * POST /api/v1/food/calculate
 * Body: { foodId, weightGrams }
 */
router.post('/calculate', handle(async (ctx) => {
  const { foodId, weightGrams } = ctx.request.body
  if (!foodId || !weightGrams) {
    return ctx.throw(400, 'foodId 和 weightGrams 不能为空')
  }

  const result = await foodService.calculateNutrition(parseInt(foodId), parseFloat(weightGrams))
  return success(result)
}))

/**
 * 食物图片识别
 * POST /api/v1/food/recognize
 * Body: { imageBase64 }
 */
router.post('/recognize', handle(async (ctx) => {
  const { imageBase64 } = ctx.request.body
  if (!imageBase64) {
    return ctx.throw(400, 'imageBase64 不能为空')
  }

  const result = await foodService.recognizeFoodFromBase64(imageBase64)
  return success(result)
}))

/**
 * 分析食物营养成分（使用AI）
 * POST /api/v1/food/analyze
 * Body: { foodName, weight }
 */
router.post('/analyze', handle(async (ctx) => {
  const { foodName, weight } = ctx.request.body;

  if (!foodName || !weight) {
    return ctx.throw(400, 'foodName 和 weight 不能为空');
  }

  const result = await foodService.analyzeFoodNutrition(foodName, parseFloat(weight));
  return success(result);
}));

/**
 * POST /api/v1/food/recognize-text
 * 文本识别食物
 */
router.post('/recognize-text', handle(async (ctx) => {
  const { text } = ctx.request.body;

  if (!text) {
    return ctx.throw(400, '缺少文本内容');
  }

  const result = await foodService.recognizeFoodFromText(text);
  
  // 如果服务返回的是带code的格式，需要判断
  if (result.code !== 0) {
    return ctx.throw(500, result.message || '识别失败');
  }
  
  return success(result.data);
}));

module.exports = router
