require('dotenv').config();
const Koa = require('koa')
const bodyParser = require('koa-bodyparser')
const koaLogger = require('koa-logger')
const serve = require('koa-static')
const path = require('path')

const config = require('./../config')
const routers = require('./routers/index')
const { Middleware } = require('./core')

const app = new Koa()

// 全局错误处理中间件（最先加载）
app.use(Middleware.errorHandler)

// CORS中间件
app.use(Middleware.cors)

// 请求日志中间件
app.use(Middleware.requestLogger)

// 配置控制台日志中间件
app.use(koaLogger())

// 配置ctx.body解析中间件
// 增加 jsonLimit 以支持图片 base64 传输（20MB）
app.use(bodyParser({
  jsonLimit: '20mb',
  formLimit: '20mb',
  textLimit: '20mb'
}))

// 静态文件服务（上传的文件）
app.use(serve(path.join(__dirname, '../static')))

// 统一响应格式中间件
app.use(Middleware.responseFormatter)

// 初始化路由中间件
app.use(routers.routes()).use(routers.allowedMethods())

// 监听启动端口
const server = app.listen(config.port)

// 设置服务器超时时间为10分钟（600秒），支持AI识别等长时间请求
server.timeout = 600000 // 10分钟
server.keepAliveTimeout = 610000 // 略大于timeout
server.headersTimeout = 620000 // 略大于keepAliveTimeout

console.log(`🚀 Yoga Server is running at http://localhost:${config.port}`)
console.log(`📖 API Documentation: http://localhost:${config.port}/api`)
console.log(`💊 Health Check: http://localhost:${config.port}/health`)
console.log(`⏱️  Server Timeout: ${server.timeout / 1000}s`)
