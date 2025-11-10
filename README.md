# 函数式架构使用指南

## 🎯 **架构概述**

函数式架构基于以下核心原则：
- **纯函数**：相同输入产生相同输出，无副作用
- **不可变性**：数据不被修改，通过创建新数据来"更新"
- **函数组合**：通过组合小函数构建复杂逻辑
- **高阶函数**：接受或返回函数的函数

## 📁 **目录结构**

```
server/
├── core-fp/              # 函数式核心模块
│   ├── response.js       # 响应处理函数
│   ├── validator.js      # 验证函数组合
│   ├── database.js       # 数据库操作函数工厂
│   ├── errors.js         # 错误处理函数
│   ├── utils.js          # 通用工具函数
│   └── index.js          # 统一导出
├── modules-fp/           # 函数式业务模块
│   └── user/             # 用户模块示例
│       ├── model.js      # 数据操作函数
│       ├── service.js    # 业务逻辑函数
│       ├── router.js     # 路由处理函数
│       └── index.js      # 模块导出
└── app.js                # 应用入口
```

## 🚀 **快速开始**

### **1. 创建模型层**
```javascript
// modules-fp/your-module/model.js
const { database } = require('../../core-fp')

// 创建数据库操作函数
const yourDb = database.createDbOperations('your_table')

// 自定义查询函数
const findByCustomField = async (value) => {
  const sql = 'SELECT * FROM your_table WHERE custom_field = ?'
  return await yourDb.queryOne(sql, [value])
}

module.exports = {
  ...yourDb,
  findByCustomField
}
```

### **2. 创建服务层**
```javascript
// modules-fp/your-module/service.js
const { validator, errors, utils } = require('../../core-fp')
const yourModel = require('./model')

const { validate, required, length } = validator
const { BusinessError } = errors
const { pipe } = utils

// 验证函数
const validateCreateData = (data) => 
  validate(
    data,
    required('name', '名称不能为空'),
    length('name', 1, 50, '名称长度应在1-50字符之间')
  )

// 业务逻辑函数
const create = async (data) => {
  validateCreateData(data)
  
  const result = await yourModel.create(data)
  if (!result.insertId) {
    throw BusinessError('创建失败')
  }
  
  return { id: result.insertId, ...data }
}

module.exports = {
  create
}
```

### **3. 创建路由层**
```javascript
// modules-fp/your-module/router.js
const router = require('koa-router')()
const { response } = require('../../core-fp')
const yourService = require('./service')

const { handle, success } = response

router.post('/', handle(async (ctx) => {
  const data = ctx.request.body
  const result = await yourService.create(data)
  return success(result, '创建成功')
}))

module.exports = router
```

## 🔧 **核心功能详解**

### **响应处理**
```javascript
const { response } = require('./core-fp')

// 基础响应
response.success(data, message)
response.error(message, code)
response.page(list, total, page, size)

// 高阶函数处理
const { handle } = response

router.get('/users', handle(async (ctx) => {
  const users = await userService.getList()
  return response.success(users)
}))
```

### **数据验证**
```javascript
const { validator } = require('./core-fp')
const { validate, required, length, email, custom, pipe } = validator

// 基础验证
const validateUser = (data) =>
  validate(
    data,
    required('username'),
    length('username', 3, 20),
    email('email'),
    custom('age', (age) => age >= 18, '年龄必须大于18岁')
  )

// 管道验证
const validateAndTransform = pipe(
  validateUser,
  (data) => ({ ...data, createdAt: new Date() })
)
```

### **数据库操作**
```javascript
const { database } = require('./core-fp')

// 创建操作函数
const userDb = database.createDbOperations('users')

// 基础操作
await userDb.create(data)
await userDb.findById(id)
await userDb.update(id, data)
await userDb.remove(id)

// 自定义查询
const findActiveUsers = async () => {
  const sql = 'SELECT * FROM users WHERE status = 1'
  return await userDb.query(sql)
}
```

### **错误处理**
```javascript
const { errors } = require('./core-fp')
const { ValidationError, BusinessError, catchError, retry } = errors

// 抛出错误
throw ValidationError('数据格式错误')
throw BusinessError('业务处理失败')

// 错误捕获
const safeOperation = catchError((error) => ({ error: error.message }))
const result = await safeOperation(riskyFunction)()

// 重试机制
const retryableOperation = retry(3, 1000)(apiCall)
```

### **工具函数**
```javascript
const { utils } = require('./core-fp')
const { pipe, compose, pick, omit, when, unless } = utils

// 函数组合
const processUser = pipe(
  pick(['name', 'email']),
  (user) => ({ ...user, id: generateId() }),
  when((user) => !user.avatar, (user) => ({ ...user, avatar: defaultAvatar }))
)

// 数据转换
const userInfo = pick(['name', 'email', 'avatar'])(user)
const publicUser = omit(['password', 'secret'])(user)
```

## 🎨 **高级模式**

### **函数组合模式**
```javascript
// 复杂业务逻辑的函数组合
const registerUser = pipe(
  validateUserRegistration,
  checkUserNotExists,
  hashPassword,
  createUser,
  sendWelcomeEmail,
  formatUserResponse
)

const result = await registerUser(userData)
```

### **柯里化模式**
```javascript
const { curry } = require('./core-fp/utils')

// 柯里化函数创建
const findByField = curry((field, value, model) => {
  const sql = `SELECT * FROM ${model.tableName} WHERE ${field} = ?`
  return model.queryOne(sql, [value])
})

// 使用
const findByEmail = findByField('email')
const findByUsername = findByField('username')

const user = await findByEmail('user@example.com', userModel)
```

### **条件执行模式**
```javascript
const { when, unless } = require('./core-fp/utils')

const processUser = pipe(
  validateUser,
  when(isNewUser, sendWelcomeEmail),
  unless(isEmailVerified, sendVerificationEmail),
  saveUser
)
```

### **错误处理管道**
```javascript
const { catchError, retry } = require('./core-fp/errors')

const robustOperation = pipe(
  retry(3, 1000),  // 重试3次
  catchError((error) => {
    console.error('Operation failed:', error)
    return { success: false, error: error.message }
  })
)

const apiCall = robustOperation(externalApiRequest)
```

## 📚 **最佳实践**

### **1. 保持函数纯净**
```javascript
// ✅ 纯函数
const addTax = (price, taxRate) => price * (1 + taxRate)

// ❌ 有副作用
let total = 0
const addToTotal = (amount) => {
  total += amount  // 修改外部状态
  return total
}
```

### **2. 使用不可变数据**
```javascript
// ✅ 不可变更新
const updateUser = (user, updates) => ({ ...user, ...updates })

// ❌ 可变更新
const updateUser = (user, updates) => {
  Object.assign(user, updates)  // 修改原对象
  return user
}
```

### **3. 偏爱函数组合**
```javascript
// ✅ 函数组合
const processData = pipe(
  validateData,
  transformData,
  saveData
)

// ❌ 命令式编程
const processData = async (data) => {
  const validated = validateData(data)
  const transformed = transformData(validated)
  const saved = await saveData(transformed)
  return saved
}
```

### **4. 使用有意义的函数名**
```javascript
// ✅ 清晰的函数名
const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
const isAdultUser = (age) => age >= 18
const excludePassword = omit(['password'])

// ❌ 模糊的函数名
const check = (input) => /* ... */
const process = (data) => /* ... */
```

## 🧪 **测试示例**

函数式架构的测试非常简单：

```javascript
// 测试纯函数
describe('User validation', () => {
  test('should validate required fields', () => {
    expect(() => validateUser({})).toThrow('用户名不能为空')
  })
  
  test('should accept valid user data', () => {
    const validUser = { username: 'john', email: 'john@example.com' }
    expect(() => validateUser(validUser)).not.toThrow()
  })
})

// 测试函数组合
describe('User registration flow', () => {
  test('should complete registration process', async () => {
    const userData = { username: 'john', email: 'john@example.com', password: '123456' }
    const result = await registerUser(userData)
    
    expect(result.id).toBeDefined()
    expect(result.password).toBeUndefined()  // 密码应该被移除
  })
})
```

## 🚀 **迁移指南**

### **从面向对象迁移到函数式**

1. **第一步：提取纯函数**
```javascript
// 面向对象
class UserService {
  hashPassword(password) {
    return crypto.createHash('sha256').update(password).digest('hex')
  }
}

// 函数式
const hashPassword = (password) => 
  crypto.createHash('sha256').update(password).digest('hex')
```

2. **第二步：移除状态依赖**
```javascript
// 面向对象
class UserService {
  constructor(model) {
    this.model = model
  }
  
  async create(data) {
    return await this.model.create(data)
  }
}

// 函数式
const createUser = (model) => async (data) => {
  return await model.create(data)
}
// 或者直接传递依赖
const createUser = async (data, model) => {
  return await model.create(data)
}
```

3. **第三步：使用函数组合**
```javascript
// 面向对象
class UserService {
  async register(userData) {
    this.validate(userData)
    const hashedData = this.hashPassword(userData)
    const user = await this.create(hashedData)
    return this.formatResponse(user)
  }
}

// 函数式
const register = pipe(
  validateUserData,
  hashUserPassword,
  createUser,
  formatUserResponse
)
```

## 💡 **总结**

函数式架构提供了：
- **更简洁的代码**：减少样板代码
- **更好的可测试性**：纯函数易于测试
- **更强的可组合性**：函数可以任意组合
- **更少的 bug**：不可变性减少副作用

这种架构特别适合 Node.js API 开发，充分发挥了 JavaScript 函数式编程的优势。
