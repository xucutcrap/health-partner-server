/**
 * 核心模块入口
 */

const response = require('./response')
const validator = require('./validator')
const errors = require('./errors')
const database = require('./database')
const utils = require('./utils')
const middleware = require('./middleware')

module.exports = {
  response,
  validator,
  errors,
  database,
  utils,
  Middleware: middleware
}
