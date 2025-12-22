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
 * Query: { groupId }
 */
router.get('/list', handle(async (ctx) => {
  const { groupId } = ctx.query
  const recipes = await recipeService.getRecipesByGroupId(groupId)
  return success(recipes)
}))

/**
 * 获取食谱详情
 * GET /api/v1/recipe/detail
 * Query: { recipeId }
 */
router.get('/detail', handle(async (ctx) => {
  const { recipeId } = ctx.query
  const detail = await recipeService.getRecipeDetail(recipeId)
  return success(detail)
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

