/**
 * 食物路由
 */
const router = require('koa-router')()
const { response } = require('../../core')
const foodService = require('./service')

const { handle, success } = response

/**
 * 获取所有食物分类
 * GET /api/v1/food/categories
 */
router.get('/categories', handle(async (ctx) => {
  const result = await foodService.getCategories()
  return success(result)
}))

/**
 * 根据分类获取食物列表
 * GET /api/v1/food/foods?categoryId=1
 */
router.get('/foods', handle(async (ctx) => {
  const { categoryId } = ctx.query
  if (!categoryId) {
    return ctx.throw(400, 'categoryId 不能为空')
  }
  
  const result = await foodService.getFoodsByCategory(parseInt(categoryId))
  return success(result)
}))

/**
 * 搜索食物
 * GET /api/v1/food/search?keyword=米饭
 */
router.get('/search', handle(async (ctx) => {
  const { keyword } = ctx.query
  if (!keyword) {
    return ctx.throw(400, 'keyword 不能为空')
  }
  
  const result = await foodService.searchFoods(keyword)
  return success(result)
}))

/**
 * 根据食物获取单位列表
 * GET /api/v1/food/units?foodId=1
 */
router.get('/units', handle(async (ctx) => {
  const { foodId } = ctx.query
  if (!foodId) {
    return ctx.throw(400, 'foodId 不能为空')
  }
  
  const result = await foodService.getUnitsByFood(parseInt(foodId))
  return success(result)
}))

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

module.exports = router



