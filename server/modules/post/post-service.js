/**
 * 帖子业务服务
 */
const { errors } = require('../../core')
const postModel = require('./post-model')
const userModel = require('../user/model')

const { BusinessError } = errors

/**
 * 发布帖子
 */
async function createPost(openId, postData) {
  if (!openId) {
    throw new BusinessError('openId 不能为空')
  }
  
  if (!postData.content || postData.content.trim() === '') {
    throw new BusinessError('帖子内容不能为空')
  }
  
  const user = await userModel.findByOpenId(openId)
  if (!user) {
    throw new BusinessError('用户不存在')
  }
  
  const postId = await postModel.create({
    userId: user.id,
    content: postData.content.trim(),
    images: postData.images || []
  })
  
  // 返回完整的帖子信息
  return await postModel.findById(postId)
}

/**
 * 获取帖子列表
 */
async function getPostList(options = {}) {
  const page = options.page || 1
  const pageSize = options.pageSize || 20
  
  const posts = await postModel.findList({
    page,
    pageSize
  })
  
  return posts
}

/**
 * 获取用户时光轴（只返回当前用户的帖子）
 */
async function getUserTimeline(openId, options = {}) {
  if (!openId) {
    throw new BusinessError('openId 不能为空')
  }
  
  const user = await userModel.findByOpenId(openId)
  if (!user) {
    throw new BusinessError('用户不存在')
  }
  
  const page = options.page || 1
  const pageSize = options.pageSize || 20
  
  const posts = await postModel.findList({
    page,
    pageSize,
    userId: user.id // 只查询当前用户的帖子
  })
  
  return posts
}

/**
 * 删除帖子
 */
async function deletePost(openId, postId) {
  if (!openId || !postId) {
    throw new BusinessError('openId 和 postId 不能为空')
  }
  
  const user = await userModel.findByOpenId(openId)
  if (!user) {
    throw new BusinessError('用户不存在')
  }
  
  const success = await postModel.deleteById(postId, user.id)
  if (!success) {
    throw new BusinessError('帖子不存在或无权删除')
  }
  
  return true
}

module.exports = {
  createPost,
  getPostList,
  getUserTimeline,
  deletePost
}

