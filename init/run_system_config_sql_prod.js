/**
 * 在线上数据库执行系统配置表SQL脚本
 * 支持通过环境变量或命令行参数指定数据库连接信息
 * 
 * 使用方式：
 * 1. 通过环境变量：
 *    DB_HOST=xxx DB_USER=xxx DB_PASSWORD=xxx DB_NAME=xxx node init/run_system_config_sql_prod.js
 * 
 * 2. 通过命令行参数：
 *    node init/run_system_config_sql_prod.js --host=xxx --user=xxx --password=xxx --database=xxx
 * 
 * 3. 使用config.js配置（如果存在）：
 *    node init/run_system_config_sql_prod.js
 */
const mysql = require('mysql')
const fs = require('fs')
const path = require('path')

// 解析命令行参数
function parseArgs() {
  const args = {}
  process.argv.slice(2).forEach(arg => {
    const match = arg.match(/^--(.+?)=(.*)$/)
    if (match) {
      args[match[1]] = match[2]
    }
  })
  return args
}

// 获取数据库配置
function getDbConfig() {
  const args = parseArgs()
  
  // 优先使用命令行参数
  if (args.host && args.user && args.password && args.database) {
    return {
      host: args.host,
      user: args.user,
      password: args.password,
      database: args.database,
      port: args.port || 3306
    }
  }
  
  // 其次使用环境变量
  if (process.env.DB_HOST && process.env.DB_USER && process.env.DB_PASSWORD && process.env.DB_NAME) {
    return {
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      port: process.env.DB_PORT || 3306
    }
  }
  
  // 最后尝试使用config.js
  try {
    const config = require('../config')
    if (config.database && config.database.HOST) {
      return {
        host: config.database.HOST,
        user: config.database.USERNAME,
        password: config.database.PASSWORD,
        database: config.database.DATABASE,
        port: config.database.PORT || 3306
      }
    }
  } catch (e) {
    // config.js不存在，忽略
  }
  
  return null
}

// 主函数
function main() {
  const dbConfig = getDbConfig()
  
  if (!dbConfig) {
    console.error('❌ 数据库配置未找到！')
    console.log('\n请使用以下方式之一指定数据库连接信息：')
    console.log('\n1. 环境变量：')
    console.log('   DB_HOST=xxx DB_USER=xxx DB_PASSWORD=xxx DB_NAME=xxx node init/run_system_config_sql_prod.js')
    console.log('\n2. 命令行参数：')
    console.log('   node init/run_system_config_sql_prod.js --host=xxx --user=xxx --password=xxx --database=xxx')
    console.log('\n3. 使用config.js（如果存在）')
    process.exit(1)
  }
  
  console.log('📡 连接数据库...')
  console.log(`   主机: ${dbConfig.host}`)
  console.log(`   用户: ${dbConfig.user}`)
  console.log(`   数据库: ${dbConfig.database}`)
  console.log(`   端口: ${dbConfig.port}`)
  console.log('')
  
  // 创建数据库连接
  const connection = mysql.createConnection({
    host: dbConfig.host,
    user: dbConfig.user,
    password: dbConfig.password,
    database: dbConfig.database,
    port: dbConfig.port,
    multipleStatements: true
  })
  
  // 读取SQL文件
  const sqlFile = path.join(__dirname, 'sql', 'create_system_config_table.sql')
  const sqlContent = fs.readFileSync(sqlFile, 'utf8')
  
  // 执行SQL
  connection.connect((err) => {
    if (err) {
      console.error('❌ 数据库连接失败:', err.message)
      connection.end()
      process.exit(1)
    }
    
    console.log('✅ 数据库连接成功！')
    console.log('📝 开始执行系统配置表SQL脚本...')
    console.log('')
    
    connection.query(sqlContent, (err, results) => {
      if (err) {
        console.error('❌ SQL执行失败:', err.message)
        console.error('错误详情:', err)
        connection.end()
        process.exit(1)
      }
      
      console.log('✅ 系统配置表创建成功！')
      console.log('✅ 配置数据插入成功！')
      console.log('')
      console.log('📋 配置信息:')
      console.log('   - 配置键: comment_enabled')
      console.log('   - 配置值: 0 (关闭)')
      console.log('   - 说明: 开关：0-关闭，1-开启')
      console.log('')
      console.log('💡 如需开启评论功能，请执行:')
      console.log("   UPDATE system_config SET config_value = '1' WHERE config_key = 'comment_enabled';")
      console.log('')
      
      // 验证数据
      connection.query('SELECT * FROM system_config WHERE config_key = ?', ['comment_enabled'], (err, rows) => {
        if (!err && rows.length > 0) {
          console.log('✅ 验证成功，配置数据:')
          console.log(JSON.stringify(rows[0], null, 2))
        }
        connection.end()
        process.exit(0)
      })
    })
  })
}

main()



