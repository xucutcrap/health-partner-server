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
 * 获取指定天数的饮食安排
 * GET /api/v1/recipe/daily-meal
 * Query: { dailyMealId }
 */
router.get('/daily-meal', handle(async (ctx) => {
  const { dailyMealId } = ctx.query
  const meals = await recipeService.getDailyMealDetail(dailyMealId)
  return success(meals)
}))

module.exports = router

