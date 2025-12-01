/**
 * 执行系统配置表SQL脚本
 */
const mysql = require('mysql')
const fs = require('fs')
const path = require('path')
const config = require('../config')

const dbConfig = config.database

// 创建数据库连接
const connection = mysql.createConnection({
  host: dbConfig.HOST,
  user: dbConfig.USERNAME,
  password: dbConfig.PASSWORD,
  database: dbConfig.DATABASE,
  multipleStatements: true
})

// 读取SQL文件
const sqlFile = path.join(__dirname, 'sql', 'create_system_config_table.sql')
const sqlContent = fs.readFileSync(sqlFile, 'utf8')

// 执行SQL
connection.connect((err) => {
  if (err) {
    console.error('数据库连接失败:', err)
    process.exit(1)
  }
  
  console.log('开始执行系统配置表SQL脚本...')
  
  connection.query(sqlContent, (err, results) => {
    if (err) {
      console.error('SQL执行失败:', err)
      connection.end()
      process.exit(1)
    }
    
    console.log('✅ 系统配置表创建成功！')
    console.log('✅ 配置数据插入成功！')
    console.log('\n配置信息:')
    console.log('- 配置键: comment_enabled')
    console.log('- 配置值: 0 (关闭)')
    console.log('- 说明: 开关：0-关闭，1-开启')
    console.log('\n如需开启评论功能，请执行:')
    console.log("UPDATE system_config SET config_value = '1' WHERE config_key = 'comment_enabled';")
    
    connection.end()
    process.exit(0)
  })
})


