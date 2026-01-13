// 统一配置文件
// 优先从环境变量读取配置 (Docker/Prod模式)
// 本地开发如果没有环境变量，依赖 .env 文件加载

// 尝试加载 .env 文件 (如果存在)
try {
  require('dotenv').config();
} catch (e) {
  // 生产环境可能不使用dotenv，忽略错误
}

const config = {
  port: process.env.PORT || 3000,
  jwtSecret: process.env.JWT_SECRET,
  database: {
    DATABASE: process.env.DB_NAME,
    USERNAME: process.env.DB_USER,
    PASSWORD: process.env.DB_PASSWORD,
    PORT: process.env.DB_PORT,
    HOST: process.env.DB_HOST
  },
  wechat: {
    appId: process.env.WECHAT_APPID,
    appSecret: process.env.WECHAT_APPSECRET,
    mchId: process.env.WECHAT_MCHID,
    certPath: process.env.WECHAT_CERT_PATH,
    keyPath: process.env.WECHAT_KEY_PATH,
    apiV3Key: process.env.WECHAT_PAY_API_V3_KEY,
    notifyUrl: process.env.WECHAT_NOTIFY_URL,
    wxPayPublicId: process.env.WECHAT_PAY_SERIAL_NO
  },
  message: {
    token: process.env.WECHAT_MESSAGE_TOKEN,
    encodingAESKey: process.env.WECHAT_MESSAGE_ENCODING_AES_KEY
  },
  baidu: {
    apiKey: process.env.BAIDU_API_KEY,
    secretKey: process.env.BAIDU_SECRET_KEY
  },
  doubao: {
    apiKey: process.env.DOUBAO_API_KEY,
    baseUrl: process.env.DOUBAO_BASE_URL,
    model: process.env.DOUBAO_MODEL
  },
  domain: process.env.DOMAIN,
  SECURITY_SALT: process.env.SECURITY_SALT
}

module.exports = config
