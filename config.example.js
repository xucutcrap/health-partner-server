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
  },
  // 安全配置：用于行为记录签名验证（必须与小程序端保持一致）
  SECURITY_SALT: 'your-custom-security-salt-change-me'

}

module.exports = config




