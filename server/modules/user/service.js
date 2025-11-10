/**
 * 小程序用户业务服务
 */
const { errors } = require('../../core')
const userModel = require('./model')
const profileModel = require('./profile-model')
const axios = require('axios')
const config = require('../../../config')

const { BusinessError } = errors

/**
 * 小程序：根据 code 获取 openId，并返回所有用户信息（包括健康档案）
 */
async function getOpenIdByCode(code) {
  try {
    const url = `https://api.weixin.qq.com/sns/jscode2session`
    const params = {
      appid: config.wechat.appId,
      secret: config.wechat.appSecret,
      js_code: code,
      grant_type: 'authorization_code'
    }
    
    const response = await axios.get(url, { params })
    const { openid, session_key, errcode, errmsg } = response.data
    
    if (errcode) {
      throw new BusinessError(errmsg || '获取 openId 失败')
    }
    
    if (!openid) {
      throw new BusinessError('未获取到 openId')
    }
    
    // 创建或更新用户（如果不存在则创建）
    const user = await userModel.createOrUpdateByOpenId(openid)
    
    // 跨表查询健康档案信息
    const profile = await profileModel.findByUserId(user.id)
    
    return {
      openId: openid,
      userId: user.id,
      sessionKey: session_key,
      nickname: user.nickname || null,
      avatarUrl: user.avatar_url || null,
      // 健康档案信息
      profile: profile ? {
        height: profile.height || null,
        weight: profile.weight || null,
        age: profile.age || null,
        gender: profile.gender || '男',
      } : null
    }
  } catch (error) {
    if (error.name === 'BusinessError') {
      throw error
    }
    throw new BusinessError('获取 openId 失败：' + error.message)
  }
}

/**
 * 根据 openId 获取用户信息
 */
async function getUserInfoByOpenId(openId) {
  if (!openId) {
    throw new BusinessError('openId 不能为空')
  }
  
  const user = await userModel.findByOpenId(openId)
  
  if (!user) {
    return null
  }
  
  return {
    id: user.id,
    openId: user.openid,
    nickname: user.nickname,
    avatarUrl: user.avatar_url
  }
}

/**
 * 更新用户信息（昵称、头像）
 */
async function updateUserInfo(openId, userInfo) {
  if (!openId) {
    throw new BusinessError('openId 不能为空')
  }
  
  const updateData = {}
  if (userInfo.nickname !== undefined) {
    updateData.nickname = userInfo.nickname
  }
  if (userInfo.avatarUrl !== undefined) {
    updateData.avatar_url = userInfo.avatarUrl
  }
  
  if (Object.keys(updateData).length === 0) {
    throw new BusinessError('没有需要更新的数据')
  }
  
  const user = await userModel.createOrUpdateByOpenId(openId, updateData)
  
  return {
    id: user.id,
    openId: user.openid,
    nickname: user.nickname,
    avatarUrl: user.avatar_url
  }
}

/**
 * 根据 openId 获取用户健康档案
 */
async function getUserProfile(openId) {
  if (!openId) {
    throw new BusinessError('openId 不能为空')
  }
  
  const user = await userModel.findByOpenId(openId)
  if (!user) {
    throw new BusinessError('用户不存在')
  }
  
  const profile = await profileModel.findByUserId(user.id)
  
  return {
    height: profile?.height || null,
    weight: profile?.weight || null,
    age: profile?.age || null,
    gender: profile?.gender || '男',
    bodyFat: profile?.body_fat || null
  }
}

/**
 * 更新用户健康档案
 */
async function updateUserProfile(openId, profileData) {
  if (!openId) {
    throw new BusinessError('openId 不能为空')
  }
  
  const user = await userModel.findByOpenId(openId)
  if (!user) {
    throw new BusinessError('用户不存在')
  }
  
  // 计算 BMI（后端计算，确保准确性）
  let bmi = null
  if (profileData.height && profileData.weight) {
    const heightInMeters = profileData.height / 100
    bmi = profileData.weight / (heightInMeters * heightInMeters)
  }
  
  const updateData = {
    height: profileData.height,
    weight: profileData.weight,
    age: profileData.age,
    gender: profileData.gender,
    body_fat: profileData.bodyFat || null
  }
  
  const profile = await profileModel.createOrUpdateByUserId(user.id, updateData)
  
  return {
    height: profile.height,
    weight: profile.weight,
    age: profile.age,
    gender: profile.gender,
    bodyFat: profile.body_fat,
    bmi: bmi ? parseFloat(bmi.toFixed(1)) : null
  }
}

module.exports = {
  getOpenIdByCode,
  getUserInfoByOpenId,
  updateUserInfo,
  getUserProfile,
  updateUserProfile
}
