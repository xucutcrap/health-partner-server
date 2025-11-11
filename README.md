# 健康伙伴服务

## ⚙️ **配置说明**

### 初始化配置

1. 复制配置文件模板：
```bash
cp config.example.js config.js
```

2. 编辑 `config.js`，填入你的配置信息：
   - 数据库连接信息
   - 微信小程序 AppID 和 AppSecret
   - JWT 密钥等

⚠️ **注意**：`config.js` 已添加到 `.gitignore`，不会被提交到版本库，请妥善保管。

## 🗄️ **数据库初始化**

### 方法一：使用初始化脚本（推荐）

1. 确保 MySQL 服务已启动
2. 确保 `config.js` 中的数据库配置正确
3. 运行初始化命令：

```bash
npm run init_sql
```

这个命令会：
- 自动读取 `init/sql/` 目录下的所有 SQL 文件
- 按顺序执行 SQL 语句
- 创建数据库和所有表结构
- 显示执行日志

### 方法二：手动执行 SQL 文件

1. 登录 MySQL：
```bash
mysql -u root -p
```

2. 执行 SQL 文件：
```bash
source /path/to/health-partner-server/init/sql/yoga_platform.sql
```

或者：
```bash
mysql -u root -p < init/sql/yoga_platform.sql
```

### 数据库表结构

初始化后会创建以下表：
- `users` - 用户表
- `user_profiles` - 用户健康档案表
- `user_goals` - 用户目标设置表
- `diet_records` - 饮食记录表
- `exercise_records` - 运动记录表
- `health_records` - 健康体征记录表
- `water_records` - 饮水记录表

## 🚀 **启动服务**

### 开发模式（带热重载）

```bash
npm run dev
```

### 生产模式

```bash
npm start
```

服务启动后，访问：
- 服务地址：http://localhost:3000
- 健康检查：http://localhost:3000/health

## 📝 **API 接口**

### 用户相关

- `POST /api/v1/user/login` - 根据 code 获取 openId
- `POST /api/v1/user/update` - 更新用户信息（昵称、头像）

## 🔧 **项目结构**

```
health-partner-server/
├── config.js              # 配置文件（不提交）
├── config.example.js      # 配置模板
├── init/                  # 初始化脚本
│   ├── index.js          # 初始化入口
│   ├── sql/              # SQL 文件
│   └── util/             # 工具函数
├── server/                # 服务端代码
│   ├── app.js            # 应用入口
│   ├── core/             # 核心模块
│   ├── modules/          # 业务模块
│   └── routers/          # 路由
└── package.json
```
