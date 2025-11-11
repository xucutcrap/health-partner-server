const config = {
  port: 3000,
  jwtSecret: process.env.JWT_SECRET || 'your-secret-key',
  database: {
    DATABASE: 'database',
    USERNAME: 'root',
    PASSWORD: 'your-database-password',
    PORT: '3306',
    HOST: 'localhost'
  },
  wechat: {
    appId: 'your-wechat-appid',
    appSecret: 'your-wechat-appsecret'
  }
}

module.exports = config



