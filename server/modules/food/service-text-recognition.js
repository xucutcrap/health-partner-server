/**
 * 从文本识别食物
 * @param {string} text - 用户输入的文本描述
 * @returns {Promise<Object>} 识别结果
 */
async function recognizeFoodFromText(text) {
  try {
    // 构建提示词
    const systemPrompt = "识别用户描述的食物,返回JSON: {\"meal_name\":\"描述\",\"overview\":{\"estimated_total_calories\":数字,\"total_protein_g\":数字,\"total_carbs_g\":数字,\"total_fat_g\":数字},\"health_score\":数字(1-10),\"ingredients\":[{\"icon\":\"emoji\",\"name\":\"食物名\",\"calories\":数字,\"estimated_weight_g\":数字}]}";

    const userPrompt = `用户描述：${text}`;

    // 调用豆包AI
    const response = await axios.post(
      `${config.doubao.baseUrl}/chat/completions`,
      {
        model: config.doubao.model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.7
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${config.doubao.apiKey}`
        },
        timeout: 120000
      }
    );

    const content = response.data.choices[0].message.content;
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    
    if (!jsonMatch) {
      throw new Error('AI返回格式错误');
    }

    const aiResult = JSON.parse(jsonMatch[0]);

    // 转换为统一格式
    const foods = aiResult.ingredients.map(ingredient => ({
      name: ingredient.name,
      weight: ingredient.estimated_weight_g || 100,
      calorie: ingredient.calories || 0,
      protein: (ingredient.calories * 0.15) / 4,
      carbs: (ingredient.calories * 0.55) / 4,
      fat: (ingredient.calories * 0.30) / 9
    }));

    return {
      code: 0,
      message: 'success',
      data: {
        foods,
        totalNutrition: {
          totalCalories: aiResult.overview.estimated_total_calories,
          totalProtein: aiResult.overview.total_protein_g,
          totalCarbs: aiResult.overview.total_carbs_g,
          totalFat: aiResult.overview.total_fat_g
        }
      }
    };
  } catch (error) {
    console.error('文本识别失败:', error);
    return {
      code: 500,
      message: '识别失败: ' + error.message,
      data: null
    };
  }
}

module.exports = {
  getFoodCategories,
  getFoodsByCategory,
  searchFoods,
  getFoodUnits,
  calculateFoodCalories,
  recognizeFoodFromImage,
  addFoodRecordByName,
  analyzeFoodNutrition,
  recognizeFoodFromText
};
