# 使用Node.js 16官方镜像 (阿里云镜像加速)
FROM registry.cn-hangzhou.aliyuncs.com/library/node:16-alpine

# 设置工作目录
WORKDIR /app

# 安装依赖配置
COPY package*.json ./
# 复制配置模板并重命名为 config.js (Docker专用，无硬编码密码)
COPY config.template.js ./config.js

# 安装依赖(包含devDependencies以便使用nodemon)
RUN npm install

# 复制应用代码
COPY . .



# 暴露应用端口
EXPOSE 3000

# 健康检查
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# 启动应用
CMD ["node", "server/app.js"]
