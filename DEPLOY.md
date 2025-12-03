# 生产环境部署指南

## 一、数据库初始化

### 1. 连接到生产数据库

```bash
# 方式一：使用命令行
mysql -h主机地址 -u用户名 -p密码

# 方式二：使用SSH隧道（如果需要）
ssh -L 3306:localhost:3306 user@服务器地址
mysql -h127.0.0.1 -u用户名 -p密码
```

### 2. 执行完整初始化脚本（推荐）

```bash
# 方式一：直接执行（会创建数据库）
mysql -h主机地址 -u用户名 -p密码 < init/sql/init_complete.sql

# 方式二：如果数据库已存在，先指定数据库
mysql -h主机地址 -u用户名 -p密码 数据库名 < init/sql/init_complete.sql
```

### 3. 初始化食物数据（可选，但推荐）

```bash
# 注意：必须使用 utf8mb4 字符集，避免中文乱码
mysql -h主机地址 -u用户名 -p密码 数据库名 --default-character-set=utf8mb4 < init/sql/init_food_data.sql
```

### 4. 验证表是否创建成功

```sql
USE health_partner;
SHOW TABLES;
```

应该看到以下14张表：
- users
- user_profiles
- user_goals
- diet_records
- exercise_records
- health_records
- water_records
- food_categories
- foods
- food_units
- posts
- post_images
- post_likes
- post_comments

## 二、后端服务部署

### 1. 配置数据库连接

复制配置文件模板：
```bash
cp config.example.js config.js
```

编辑 `config.js`，配置生产环境数据库信息：
```javascript
module.exports = {
  database: {
    HOST: '生产数据库主机地址',
    USER: '数据库用户名',
    PASSWORD: '数据库密码',
    DATABASE: 'health_partner',
    PORT: 3306
  }
}
```

### 2. 安装依赖

```bash
cd health-partner-server
npm install
```

### 3. 创建静态文件目录

```bash
mkdir -p static/output/upload/avatar
mkdir -p static/output/upload/post
```

### 4. 启动服务

#### 方式一：使用 PM2（推荐）

```bash
# 安装 PM2
npm install -g pm2

# 启动服务
pm2 start server/app.js --name health-partner

# 查看状态
pm2 status

# 查看日志
pm2 logs health-partner

# 设置开机自启
pm2 startup
pm2 save
```

#### 方式二：使用 nohup

```bash
nohup node server/app.js > logs/app.log 2>&1 &
```

#### 方式三：使用 systemd（Linux）

创建 `/etc/systemd/system/health-partner.service`：
```ini
[Unit]
Description=Health Partner Backend Service
After=network.target

[Service]
Type=simple
User=your-user
WorkingDirectory=/path/to/health-partner-server
ExecStart=/usr/bin/node server/app.js
Restart=always
RestartSec=10
StandardOutput=syslog
StandardError=syslog
SyslogIdentifier=health-partner

[Install]
WantedBy=multi-user.target
```

启动服务：
```bash
sudo systemctl daemon-reload
sudo systemctl enable health-partner
sudo systemctl start health-partner
```

### 5. 配置 Nginx 反向代理（可选）

```nginx
server {
    listen 80;
    server_name your-domain.com;

    # 增加请求体大小限制（用于图片识别等大文件上传）
    client_max_body_size 20M;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        
        # 增加代理超时时间（用于图片识别等长时间请求）
        proxy_connect_timeout 300s;
        proxy_send_timeout 300s;
        proxy_read_timeout 300s;
    }

    # 静态文件服务
    location /output/ {
        alias /path/to/health-partner-server/static/output/;
        expires 30d;
    }
}
```

**重要提示**：
- `client_max_body_size 20M;` - 允许最大 20MB 的请求体（图片 base64 编码通常需要较大空间）
- `proxy_read_timeout 300s;` - 增加代理读取超时到 300 秒（图片识别可能需要较长时间）
- 修改配置后需要重启 nginx：`sudo nginx -t && sudo nginx -s reload`

## 三、小程序配置

### 1. 更新 API 地址

编辑 `health-partner-miniapp/src/utils/http.js`：
```javascript
const BASE_URL = 'https://your-domain.com';  // 生产环境API地址
```

### 2. 配置小程序域名白名单

在微信公众平台配置：
- 开发 → 开发管理 → 开发设置 → 服务器域名
- 添加 `request合法域名`：`https://your-domain.com`
- 添加 `uploadFile合法域名`：`https://your-domain.com`

### 3. 上传代码

使用微信开发者工具：
1. 点击"上传"
2. 填写版本号和项目备注
3. 提交审核

## 四、环境检查清单

- [ ] 数据库已初始化，所有表已创建
- [ ] 食物数据已导入（可选但推荐）
- [ ] 后端配置文件 `config.js` 已正确配置
- [ ] 静态文件目录已创建
- [ ] 后端服务已启动并正常运行
- [ ] 小程序 API 地址已更新为生产环境
- [ ] 小程序域名白名单已配置
- [ ] 防火墙已开放相应端口（如3000）

## 五、常见问题

### 1. 数据库连接失败

- 检查数据库地址、用户名、密码是否正确
- 检查数据库是否允许远程连接
- 检查防火墙是否开放3306端口

### 2. 中文乱码

- 确保数据库使用 `utf8mb4` 字符集
- 确保执行SQL脚本时使用 `--default-character-set=utf8mb4`

### 3. 静态文件无法访问

- 检查 `static` 目录权限
- 检查 Nginx 配置（如果使用）
- 检查文件路径是否正确

### 4. 小程序无法请求接口

- 检查域名白名单配置
- 检查 HTTPS 证书是否有效
- 检查后端服务是否正常运行

### 5. 413 Request Entity Too Large（Nginx）

如果使用 Nginx 反向代理，遇到 413 错误时：

1. 编辑 nginx 配置文件（通常在 `/etc/nginx/sites-available/default` 或 `/etc/nginx/nginx.conf`）
2. 在 `server` 块中添加：
   ```nginx
   client_max_body_size 20M;
   ```
3. 在 `location /` 块中添加超时设置：
   ```nginx
   proxy_read_timeout 300s;
   proxy_connect_timeout 300s;
   proxy_send_timeout 300s;
   ```
4. 测试配置：`sudo nginx -t`
5. 重新加载配置：`sudo nginx -s reload`

## 六、备份建议

### 数据库备份

```bash
# 每日备份脚本
mysqldump -h主机地址 -u用户名 -p密码 health_partner > backup_$(date +%Y%m%d).sql

# 恢复备份
mysql -h主机地址 -u用户名 -p密码 health_partner < backup_20250101.sql
```

### 静态文件备份

```bash
# 备份上传的文件
tar -czf static_backup_$(date +%Y%m%d).tar.gz static/output/
```




