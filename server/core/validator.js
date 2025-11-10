/**
 * 函数式数据验证工具
 */

/**
 * 创建验证错误
 */
const createValidationError = (message, details = []) => {
  const error = new Error(message)
  error.name = 'ValidationError'
  error.details = details
  return error
}

/**
 * 基础验证函数 - 返回验证器函数
 */
const required = (field, message) => (data) => {
  if (!data[field] && data[field] !== 0) {
    throw createValidationError(message || `${field} 是必填字段`)
  }
  return data
}

const length = (field, min = 0, max = Infinity, message) => (data) => {
  const value = data[field]
  if (value && (value.length < min || value.length > max)) {
    throw createValidationError(
      message || `${field} 长度应在 ${min}-${max} 之间`
    )
  }
  return data
}

const email = (field, message) => (data) => {
  const value = data[field]
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (value && !emailRegex.test(value)) {
    throw createValidationError(message || `${field} 格式不正确`)
  }
  return data
}

const phone = (field, message) => (data) => {
  const value = data[field]
  const phoneRegex = /^1[3-9]\d{9}$/
  if (value && !phoneRegex.test(value)) {
    throw createValidationError(message || `${field} 格式不正确`)
  }
  return data
}

const custom = (field, predicate, message) => (data) => {
  const value = data[field]
  if (!predicate(value)) {
    throw createValidationError(message)
  }
  return data
}

/**
 * 管道验证 - 函数组合
 */
const pipe = (...fns) => (data) => fns.reduce((result, fn) => fn(result), data)

/**
 * 验证数据 - 使用管道组合多个验证器
 */
const validate = (data, ...validationFns) => {
  return pipe(...validationFns)(data)
}

/**
 * 快捷验证函数 - 声明式验证
 */
const validateSchema = (schema) => (data) => {
  const validators = schema.map(rule => {
    const { field, type, ...options } = rule
    
    switch (type) {
      case 'required':
        return required(field, options.message)
      case 'length':
        return length(field, options.min, options.max, options.message)
      case 'email':
        return email(field, options.message)
      case 'phone':
        return phone(field, options.message)
      case 'custom':
        return custom(field, options.predicate, options.message)
      default:
        throw new Error(`Unknown validation type: ${type}`)
    }
  })
  
  return validate(data, ...validators)
}

module.exports = {
  required,
  length,
  email,
  phone,
  custom,
  pipe,
  validate,
  validateSchema,
  createValidationError
}
