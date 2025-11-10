/**
 * 函数式用户业务服务
 */
const { validator, errors, utils, database } = require('../../core')
const userModel = require('./model')

const { 
  validate, required, length, email, custom 
} = validator

const { 
  AuthError, BusinessError, throwIf 
} = errors

const { 
  hashPassword, verifyPassword, pick, getCurrentTime, pipe 
} = utils

const { getPagination } = database

/**
 * 用户数据验证规则
 */
const validateUserRegister = (userData) => 
  validate(
    userData,
    required('username', '用户名不能为空'),
    length('username', 3, 20, '用户名长度应在3-20字符之间'),
    custom('username', (value) => /^[a-zA-Z0-9_]+$/.test(value), '用户名只能包含字母、数字和下划线'),
    required('email', '邮箱不能为空'),
    email('email', '邮箱格式不正确'),
    required('password', '密码不能为空'),
    length('password', 6, 50, '密码长度应在6-50字符之间')
  )

const validateUserLogin = (loginData) =>
  validate(
    loginData,
    required('username', '用户名不能为空'),
    required('password', '密码不能为空')
  )

const validateUserUpdate = (updateData) =>
  validate(
    updateData,
    updateData.nickname ? length('nickname', 1, 50, '昵称长度应在1-50字符之间') : (data) => data,
    updateData.email ? email('email', '邮箱格式不正确') : (data) => data
  )

const validatePasswordChange = (passwordData) =>
  validate(
    passwordData,
    required('oldPassword', '原密码不能为空'),
    required('newPassword', '新密码不能为空'),
    length('newPassword', 6, 50, '新密码长度应在6-50字符之间')
  )

/**
 * 检查用户存在性
 */
const checkUserExists = async (username, email) => {
  const existUser = await userModel.checkExist(username, email)
  if (existUser) {
    if (existUser.username === username) {
      throw BusinessError('用户名已存在')
    }
    if (existUser.email === email) {
      throw BusinessError('邮箱已被使用')
    }
  }
  return { username, email }
}

/**
 * 创建用户数据
 */
const createUserData = (userData) => ({
  username: userData.username,
  email: userData.email,
  password: hashPassword(userData.password),
  nickname: userData.nickname || userData.username,
  avatar: userData.avatar || '',
  status: 1,
  create_time: getCurrentTime(),
  update_time: getCurrentTime()
})

/**
 * 格式化用户信息（移除敏感字段）
 */
const formatUserInfo = pick(['id', 'username', 'email', 'nickname', 'avatar', 'status', 'create_time', 'last_login_time'])

/**
 * 查找用户（支持用户名或邮箱）
 */
const findUserByUsernameOrEmail = async (username) => {
  let user = await userModel.findByUsername(username)
  if (!user) {
    user = await userModel.findByEmail(username)
  }
  if (!user) {
    throw AuthError('用户名或密码错误')
  }
  return user
}

/**
 * 验证用户状态和密码
 */
const validateUserCredentials = (loginData) => (user) => {
  // 验证密码
  if (!verifyPassword(loginData.password, user.password)) {
    throw AuthError('用户名或密码错误')
  }
  
  // 检查用户状态
  if (user.status !== 1) {
    throw AuthError('账户已被禁用')
  }
  
  return user
}

/**
 * 业务逻辑函数
 */

/**
 * 用户注册
 */
const register = async (userData) => {
  // 数据验证
  validateUserRegister(userData)
  
  // 检查用户是否已存在
  await checkUserExists(userData.username, userData.email)
  
  // 创建用户
  const userCreateData = createUserData(userData)
  const result = await userModel.create(userCreateData)
  
  if (!result.insertId) {
    throw BusinessError('用户创建失败')
  }
  
  // 返回用户信息（不包含敏感字段）
  return {
    id: result.insertId,
    username: userData.username,
    email: userData.email,
    nickname: userCreateData.nickname,
    avatar: userCreateData.avatar
  }
}

/**
 * 用户登录
 */
const login = async (loginData) => {
  // 数据验证
  validateUserLogin(loginData)
  
  // 查找用户并验证凭据
  const user = await pipe(
    findUserByUsernameOrEmail,
    validateUserCredentials(loginData)
  )(loginData.username)
  
  // 更新最后登录时间
  await userModel.updateLastLogin(user.id)
  
  // 返回用户信息
  return formatUserInfo(user)
}

/**
 * 获取用户信息
 */
const getUserInfo = async (userId) => {
  const user = await userModel.findById(userId)
  if (!user) {
    throw AuthError('用户不存在')
  }
  
  return {
    ...formatUserInfo(user),
    createTime: user.create_time,
    lastLoginTime: user.last_login_time
  }
}

/**
 * 更新用户信息
 */
const updateUser = async (userId, updateData) => {
  // 数据验证
  validateUserUpdate(updateData)
  
  // 检查用户是否存在
  const user = await userModel.findById(userId)
  if (!user) {
    throw BusinessError('用户不存在')
  }
  
  // 如果更新邮箱，检查是否已被使用
  if (updateData.email && updateData.email !== user.email) {
    const existUser = await userModel.findByEmail(updateData.email)
    if (existUser) {
      throw BusinessError('邮箱已被使用')
    }
  }
  
  // 更新数据
  const updateFields = {
    ...pick(['nickname', 'email', 'avatar'])(updateData),
    update_time: getCurrentTime()
  }
  
  await userModel.update(userId, updateFields)
  
  // 返回更新后的用户信息
  return await getUserInfo(userId)
}

/**
 * 用户列表（分页）
 */
const getUserList = async (options = {}) => {
  const { page, size, offset } = getPagination(options.page, options.size)
  
  const result = await userModel.findUserList({
    keyword: options.keyword,
    status: options.status,
    offset,
    limit: size
  })
  
  return {
    list: result.list,
    total: result.total,
    page,
    size
  }
}

/**
 * 修改密码
 */
const changePassword = async (userId, passwordData) => {
  // 数据验证
  validatePasswordChange(passwordData)
  
  // 获取用户信息
  const user = await userModel.findById(userId)
  if (!user) {
    throw BusinessError('用户不存在')
  }
  
  // 验证原密码
  if (!verifyPassword(passwordData.oldPassword, user.password)) {
    throw AuthError('原密码错误')
  }
  
  // 更新密码
  await userModel.update(userId, {
    password: hashPassword(passwordData.newPassword),
    update_time: getCurrentTime()
  })
  
  return true
}

module.exports = {
  register,
  login,
  getUserInfo,
  updateUser,
  getUserList,
  changePassword,
  
  // 导出验证函数供其他模块使用
  validateUserRegister,
  validateUserLogin,
  validateUserUpdate,
  validatePasswordChange
}
