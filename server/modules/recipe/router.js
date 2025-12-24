/**
 * 食谱路由
 */
const router = require('koa-router')()
const { response } = require('../../core')
const recipeService = require('./service')

const { handle, success } = response

/**
 * 获取所有食谱分类
 * GET /api/v1/recipe/groups
 */
router.get('/groups', handle(async (ctx) => {
  const groups = await recipeService.getAllGroups()
  return success(groups)
}))

/**
 * 根据分类ID获取食谱列表
 * GET /api/v1/recipe/list
 * Query: { groupId, openId }
 */
router.get('/list', handle(async (ctx) => {
  const { groupId, openId } = ctx.query
  
  // 如果是"我的食谱"分类（groupId=0），返回用户收藏的食谱
  if (groupId === '0') {
    if (!openId) {
      return ctx.throw(400, 'openId 不能为空')
    }
    const recipes = await recipeService.getUserFavoriteRecipesByOpenId(openId)
    return success(recipes)
  }
  
  const recipes = await recipeService.getRecipesByGroupId(groupId)
  return success(recipes)
}))

/**
 * 获取食谱详情
 * GET /api/v1/recipe/detail
 * Query: { recipeId, openId }
 */
router.get('/detail', handle(async (ctx) => {
  const { recipeId, openId } = ctx.query
  const detail = await recipeService.getRecipeDetail(recipeId, openId)
  return success(detail)
}))

/**
 * 添加收藏
 * POST /api/v1/recipe/favorite
 * Body: { openId, recipeId, notes }
 */
router.post('/favorite', handle(async (ctx) => {
  const { openId, recipeId, notes } = ctx.request.body
  if (!openId) {
    return ctx.throw(400, 'openId 不能为空')
  }
  const result = await recipeService.addFavoriteByOpenId(openId, recipeId, notes)
  return success(result)
}))

/**
 * 取消收藏
 * DELETE /api/v1/recipe/favorite
 * Body: { openId, recipeId }
 */
router.delete('/favorite', handle(async (ctx) => {
  const { openId, recipeId } = ctx.request.body
  if (!openId) {
    return ctx.throw(400, 'openId 不能为空')
  }
  const result = await recipeService.removeFavoriteByOpenId(openId, recipeId)
  return success(result)
}))

/**
 * 检查是否收藏
 * GET /api/v1/recipe/favorite/check
 * Query: { openId, recipeId }
 */
router.get('/favorite/check', handle(async (ctx) => {
  const { openId, recipeId } = ctx.query
  if (!openId) {
    return ctx.throw(400, 'openId 不能为空')
  }
  const isFavorite = await recipeService.checkUserFavoriteByOpenId(openId, recipeId)
  return success({ isFavorite })
}))

/**
 * 获取指定天数的饮食安排（支持多规格）
 * GET /api/v1/recipe/daily-meal
 * Query: { dailyMealId }
 */
router.get('/daily-meal', handle(async (ctx) => {
  const { dailyMealId } = ctx.query
  const meals = await recipeService.getDailyMealDetail(dailyMealId)
  return success(meals)
}))

/**
 * 获取食物的所有规格
 * GET /api/v1/recipe/food-specs
 * Query: { foodId }
 */
router.get('/food-specs', handle(async (ctx) => {
  const { foodId } = ctx.query
  const specs = await recipeService.getFoodSpecs(foodId)
  return success(specs)
}))

/**
 * 获取食物详情（包含所有规格）
 * GET /api/v1/recipe/food-detail
 * Query: { foodId }
 */
router.get('/food-detail', handle(async (ctx) => {
  const { foodId } = ctx.query
  const detail = await recipeService.getFoodDetail(foodId)
  return success(detail)
}))

module.exports = router

