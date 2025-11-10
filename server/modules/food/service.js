/**
 * 食物业务服务
 */
const categoryModel = require('./category-model')
const foodModel = require('./food-model')
const unitModel = require('./unit-model')

/**
 * 获取所有食物分类
 */
async function getCategories() {
  const categories = await categoryModel.findAll()
  return categories.map(cat => ({
    id: cat.id,
    name: cat.name,
    icon: cat.icon || null,
    sortOrder: cat.sort_order
  }))
}

/**
 * 根据分类ID获取食物列表
 */
async function getFoodsByCategory(categoryId) {
  if (!categoryId) {
    return []
  }
  
  const foods = await foodModel.findByCategoryId(categoryId)
  return foods.map(food => ({
    id: food.id,
    categoryId: food.category_id,
    name: food.name,
    icon: food.icon || null,
    caloriesPer100g: parseFloat(food.calories_per_100g),
    proteinPer100g: parseFloat(food.protein_per_100g || 0),
    carbsPer100g: parseFloat(food.carbs_per_100g || 0),
    fatPer100g: parseFloat(food.fat_per_100g || 0),
    fiberPer100g: parseFloat(food.fiber_per_100g || 0),
    sortOrder: food.sort_order
  }))
}

/**
 * 搜索食物
 */
async function searchFoods(keyword) {
  if (!keyword || keyword.trim() === '') {
    return []
  }
  
  const foods = await foodModel.searchByName(keyword.trim())
  return foods.map(food => ({
    id: food.id,
    categoryId: food.category_id,
    name: food.name,
    icon: food.icon || null,
    caloriesPer100g: parseFloat(food.calories_per_100g),
    proteinPer100g: parseFloat(food.protein_per_100g || 0),
    carbsPer100g: parseFloat(food.carbs_per_100g || 0),
    fatPer100g: parseFloat(food.fat_per_100g || 0),
    fiberPer100g: parseFloat(food.fiber_per_100g || 0),
    sortOrder: food.sort_order
  }))
}

/**
 * 根据食物ID获取单位列表
 */
async function getUnitsByFood(foodId) {
  if (!foodId) {
    return []
  }
  
  const units = await unitModel.findByFoodId(foodId)
  return units.map(unit => ({
    id: unit.id,
    foodId: unit.food_id,
    unitName: unit.unit_name,
    weightGrams: parseFloat(unit.weight_grams),
    sortOrder: unit.sort_order
  }))
}

/**
 * 计算食物的营养信息（根据重量）
 */
async function calculateNutrition(foodId, weightGrams) {
  const food = await foodModel.findById(foodId)
  if (!food) {
    throw new Error('食物不存在')
  }
  
  const ratio = weightGrams / 100
  
  return {
    calories: Math.round(parseFloat(food.calories_per_100g) * ratio),
    protein: parseFloat((parseFloat(food.protein_per_100g || 0) * ratio).toFixed(2)),
    carbs: parseFloat((parseFloat(food.carbs_per_100g || 0) * ratio).toFixed(2)),
    fat: parseFloat((parseFloat(food.fat_per_100g || 0) * ratio).toFixed(2)),
    fiber: parseFloat((parseFloat(food.fiber_per_100g || 0) * ratio).toFixed(2))
  }
}

module.exports = {
  getCategories,
  getFoodsByCategory,
  searchFoods,
  getUnitsByFood,
  calculateNutrition
}

