/**
 * 函数式错误处理工具
 */

/**
 * 错误创建函数 - 工厂函数
 */
const createError = (name, defaultMessage) => (message = defaultMessage) => {
  const error = new Error(message)
  error.name = name
  return error
}

// 预定义错误类型
const ValidationError = createError('ValidationError', '数据验证失败')
const AuthError = createError('AuthError', '身份认证失败')
const ForbiddenError = createError('ForbiddenError', '没有访问权限')
const NotFoundError = createError('NotFoundError', '资源不存在')
const BusinessError = createError('BusinessError', '业务处理失败')

/**
 * 错误处理高阶函数
 */
const catchError = (errorHandler) => (fn) => async (...args) => {
  try {
    return await fn(...args)
  } catch (error) {
    return errorHandler(error)
  }
}

/**
 * 错误重试高阶函数
 */
const retry = (maxAttempts = 3, delay = 1000) => (fn) => async (...args) => {
  let lastError
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn(...args)
    } catch (error) {
      lastError = error
      if (attempt < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, delay))
      }
    }
  }
  
  throw lastError
}

/**
 * 条件性错误抛出
 */
const throwIf = (condition, errorFn) => (data) => {
  if (condition(data)) {
    throw errorFn()
  }
  return data
}

/**
 * 错误映射函数
 */
const mapError = (errorMap) => (error) => {
  const ErrorConstructor = errorMap[error.constructor.name] || errorMap.default
  return ErrorConstructor ? ErrorConstructor(error.message) : error
}

module.exports = {
  createError,
  ValidationError,
  AuthError,
  ForbiddenError,
  NotFoundError,
  BusinessError,
  catchError,
  retry,
  throwIf,
  mapError
}
