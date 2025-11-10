const config = {
  port: 3000,
  jwtSecret: process.env.JWT_SECRET || 'your-secret-key',
  database: {
    DATABASE: 'yoga_platform',
    USERNAME: 'root',
    PASSWORD: '18370263_Root',
    PORT: '3306',
    HOST: 'localhost'
  }
}

module.exports = config
