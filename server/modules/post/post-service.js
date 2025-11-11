/**
 * 帖子业务服务
 */
const { errors } = require('../../core')
const postModel = require('./post-model')
const userModel = require('../user/model')
const likeModel = require('./post-like-model')
const commentModel = require('./post-comment-model')

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
  const openId = options.openId || null
  
  const posts = await postModel.findList({
    page,
    pageSize
  })
  
  // 如果提供了openId，批量获取点赞信息
  if (openId && posts.length > 0) {
    const user = await userModel.findByOpenId(openId)
    if (user) {
      const postIds = posts.map(p => p.id)
      const likesInfo = await likeModel.getLikesInfo(postIds, user.id)
      
      // 将点赞信息附加到每个帖子
      posts.forEach(post => {
        const info = likesInfo[post.id] || { count: 0, isLiked: false }
        post.likeCount = info.count
        post.isLiked = info.isLiked
      })
    }
  }
  
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
  
  // 批量获取点赞信息
  if (posts.length > 0) {
    const postIds = posts.map(p => p.id)
    const likesInfo = await likeModel.getLikesInfo(postIds, user.id)
    
    // 将点赞信息附加到每个帖子
    posts.forEach(post => {
      const info = likesInfo[post.id] || { count: 0, isLiked: false }
      post.likeCount = info.count
      post.isLiked = info.isLiked
    })
  }
  
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

/**
 * 点赞/取消点赞
 */
async function toggleLike(openId, postId) {
  if (!openId || !postId) {
    throw new BusinessError('openId 和 postId 不能为空')
  }
  
  const user = await userModel.findByOpenId(openId)
  if (!user) {
    throw new BusinessError('用户不存在')
  }
  
  const isLiked = await likeModel.isLiked(postId, user.id)
  
  if (isLiked) {
    // 取消点赞
    await likeModel.removeLike(postId, user.id)
    const likeCount = await likeModel.getLikeCount(postId)
    return { liked: false, likeCount }
  } else {
    // 添加点赞
    await likeModel.addLike(postId, user.id)
    const likeCount = await likeModel.getLikeCount(postId)
    return { liked: true, likeCount }
  }
}

/**
 * 获取帖子评论列表
 */
async function getPostComments(postId) {
  if (!postId) {
    throw new BusinessError('postId 不能为空')
  }
  
  const comments = await commentModel.findByPostId(postId)
  return comments
}

/**
 * 添加评论
 */
async function addComment(openId, commentData) {
  if (!openId) {
    throw new BusinessError('openId 不能为空')
  }
  
  if (!commentData.postId || !commentData.content || !commentData.content.trim()) {
    throw new BusinessError('帖子ID和评论内容不能为空')
  }
  
  const user = await userModel.findByOpenId(openId)
  if (!user) {
    throw new BusinessError('用户不存在')
  }
  
  // 如果是二级评论，需要验证父评论是否存在
  if (commentData.parentId) {
    const parentComment = await commentModel.findById(commentData.parentId)
    if (!parentComment || parentComment.post_id !== commentData.postId) {
      throw new BusinessError('父评论不存在')
    }
    // 二级评论的parent_id应该指向一级评论
    // 如果parentComment本身是二级评论，则使用它的parent_id
    commentData.parentId = parentComment.parent_id || parentComment.id
    commentData.replyToUserId = commentData.replyToUserId || parentComment.user_id
  }
  
  const comment = await commentModel.create({
    postId: commentData.postId,
    userId: user.id,
    parentId: commentData.parentId || null,
    replyToUserId: commentData.replyToUserId || null,
    content: commentData.content.trim()
  })
  
  return comment
}

/**
 * 删除评论
 */
async function deleteComment(openId, commentId) {
  if (!openId || !commentId) {
    throw new BusinessError('openId 和 commentId 不能为空')
  }
  
  const user = await userModel.findByOpenId(openId)
  if (!user) {
    throw new BusinessError('用户不存在')
  }
  
  const success = await commentModel.deleteById(commentId, user.id)
  if (!success) {
    throw new BusinessError('评论不存在或无权删除')
  }
  
  return true
}

module.exports = {
  createPost,
  getPostList,
  getUserTimeline,
  deletePost,
  toggleLike,
  getPostComments,
  addComment,
  deleteComment
}

