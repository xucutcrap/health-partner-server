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
 * POST /api/v1/recipe/favorite/remove (兼容小程序)
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

// 兼容小程序的 POST 方式取消收藏
router.post('/favorite/remove', handle(async (ctx) => {
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

/**
 * ==================== 打卡相关 ====================
 */

/**
 * 获取打卡进度
 * GET /api/v1/recipe/check-in/progress
 * Query: { openId, recipeId }
 */
router.get('/check-in/progress', handle(async (ctx) => {
  const { openId, recipeId } = ctx.query
  if (!openId) {
    return ctx.throw(400, 'openId 不能为空')
  }
  if (!recipeId) {
    return ctx.throw(400, 'recipeId 不能为空')
  }
  const progress = await recipeService.getCheckInProgressByOpenId(openId, recipeId)
  return success(progress)
}))

/**
 * 执行打卡
 * POST /api/v1/recipe/check-in
 * Body: { openId, recipeId, dailyMealId, dayNumber, notes }
 */
router.post('/check-in', handle(async (ctx) => {
  const { openId, recipeId, dailyMealId, dayNumber, notes } = ctx.request.body
  if (!openId) {
    return ctx.throw(400, 'openId 不能为空')
  }
  const result = await recipeService.checkInByOpenId(openId, recipeId, dailyMealId, dayNumber, notes)
  return success(result)
}))

/**
 * 取消打卡
 * DELETE /api/v1/recipe/check-in
 * Body: { openId, recipeId, dayNumber }
 */
router.delete('/check-in', handle(async (ctx) => {
  const { openId, recipeId, dayNumber } = ctx.query
  if (!openId) {
    return ctx.throw(400, 'openId 不能为空')
  }
  const result = await recipeService.cancelCheckInByOpenId(openId, recipeId, dayNumber)
  return success(result)
}))

/**
 * 重置打卡记录
 * POST /api/v1/recipe/check-in/reset
 * Body: { openId, recipeId }
 */
router.post('/check-in/reset', handle(async (ctx) => {
  const { openId, recipeId } = ctx.request.body
  if (!openId) {
    return ctx.throw(400, 'openId 不能为空')
  }
  if (!recipeId) {
    return ctx.throw(400, 'recipeId 不能为空')
  }
  const result = await recipeService.resetCheckInByOpenId(openId, recipeId)
  return success(result)
}))

/**
 * 获取打卡历史
 * GET /api/v1/recipe/check-in/history
 * Query: { openId, recipeId }
 */
router.get('/check-in/history', handle(async (ctx) => {
  const { openId, recipeId } = ctx.query
  if (!openId) {
    return ctx.throw(400, 'openId 不能为空')
  }
  if (!recipeId) {
    return ctx.throw(400, 'recipeId 不能为空')
  }
  const history = await recipeService.getCheckInHistoryByOpenId(openId, recipeId)
  return success(history)
}))

// ...
// (Added at the end or appropriate place)
// Let's add it near /list
// But to minimize diff context issues, will append before module.exports

/**
 * 获取推荐食谱
 * GET /api/v1/recipe/recommend
 */
router.get('/recommend', handle(async (ctx) => {
  const recipes = await recipeService.getRecommendedRecipes()
  return success(recipes)
}))

module.exports = router

