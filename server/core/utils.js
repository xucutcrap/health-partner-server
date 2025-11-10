/**
 * 函数式通用工具
 */
const crypto = require('crypto')

/**
 * 函数组合工具
 */
const compose = (...fns) => (value) => fns.reduceRight((acc, fn) => fn(acc), value)
const pipe = (...fns) => (value) => fns.reduce((acc, fn) => fn(acc), value)

/**
 * 柯里化函数
 */
const curry = (fn) => (...args) => 
  args.length >= fn.length ? fn(...args) : curry(fn.bind(null, ...args))

/**
 * 偏函数应用
 */
const partial = (fn, ...argsToApply) => (...restArgs) => fn(...argsToApply, ...restArgs)

/**
 * 异步函数组合
 */
const asyncPipe = (...fns) => (value) => 
  fns.reduce(async (acc, fn) => fn(await acc), value)

/**
 * 条件执行
 */
const when = (predicate, fn) => (value) => predicate(value) ? fn(value) : value
const unless = (predicate, fn) => (value) => predicate(value) ? value : fn(value)

/**
 * 数据转换工具
 */
const pick = (keys) => (obj) => 
  keys.reduce((acc, key) => ({ ...acc, [key]: obj[key] }), {})

const omit = (keys) => (obj) => 
  Object.keys(obj)
    .filter(key => !keys.includes(key))
    .reduce((acc, key) => ({ ...acc, [key]: obj[key] }), {})

const mapKeys = (fn) => (obj) => 
  Object.keys(obj).reduce((acc, key) => ({ ...acc, [fn(key)]: obj[key] }), {})

const mapValues = (fn) => (obj) => 
  Object.keys(obj).reduce((acc, key) => ({ ...acc, [key]: fn(obj[key]) }), {})

/**
 * 密码处理工具 - 纯函数
 */
const hashPassword = (password) => 
  crypto.createHash('sha256').update(password).digest('hex')

const verifyPassword = (password, hashedPassword) => 
  hashPassword(password) === hashedPassword

/**
 * 时间工具
 */
const getCurrentTime = () => new Date()
const getTimestamp = () => Date.now()

/**
 * 数组工具
 */
const isEmpty = (arr) => !arr || arr.length === 0
const isNotEmpty = (arr) => arr && arr.length > 0
const head = (arr) => arr[0]
const tail = (arr) => arr.slice(1)
const last = (arr) => arr[arr.length - 1]

/**
 * 对象工具
 */
const isObject = (obj) => obj !== null && typeof obj === 'object'
const hasProperty = (prop) => (obj) => obj.hasOwnProperty(prop)
const getProperty = (prop) => (obj) => obj[prop]
const setProperty = (prop, value) => (obj) => ({ ...obj, [prop]: value })

/**
 * 类型检查
 */
const isString = (value) => typeof value === 'string'
const isNumber = (value) => typeof value === 'number'
const isFunction = (value) => typeof value === 'function'
const isArray = (value) => Array.isArray(value)

module.exports = {
  // 函数组合
  compose,
  pipe,
  curry,
  partial,
  asyncPipe,
  
  // 条件执行
  when,
  unless,
  
  // 数据转换
  pick,
  omit,
  mapKeys,
  mapValues,
  
  // 密码工具
  hashPassword,
  verifyPassword,
  
  // 时间工具
  getCurrentTime,
  getTimestamp,
  
  // 数组工具
  isEmpty,
  isNotEmpty,
  head,
  tail,
  last,
  
  // 对象工具
  isObject,
  hasProperty,
  getProperty,
  setProperty,
  
  // 类型检查
  isString,
  isNumber,
  isFunction,
  isArray
}
