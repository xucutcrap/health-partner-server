/**
 * 函数式响应处理工具
 */

/**
 * 成功响应
 */
const success = (data = null, message = '操作成功', code = 200) => ({
  success: true,
  code,
  message,
  data,
  timestamp: Date.now()
})

/**
 * 错误响应
 */
const error = (message = '操作失败', code = 500, data = null) => ({
  success: false,
  code,
  message,
  data,
  timestamp: Date.now()
})

/**
 * 分页响应
 */
const page = (list = [], total = 0, page = 1, size = 10) => 
  success({
    list,
    pagination: {
      total,
      page,
      size,
      pages: Math.ceil(total / size)
    }
  })

/**
 * 统一异步请求处理 - 高阶函数
 */
const handle = (handler) => async (ctx) => {
  try {
    const result = await handler(ctx)
    ctx.body = result || success()
  } catch (err) {
    console.error('API Error:', err)
    
    // 错误类型映射
    const errorMap = {
      ValidationError: () => error(err.message, 400),
      AuthError: () => error(err.message, 401),
      ForbiddenError: () => error(err.message, 403),
      NotFoundError: () => error(err.message, 404)
    }
    
    const errorHandler = errorMap[err.name] || (() => 
      error(err.message || '服务器内部错误', 500)
    )
    
    ctx.body = errorHandler()
  }
}

/**
 * 响应工具函数组合
 */
module.exports = {
  success,
  error,
  page,
  handle
}
