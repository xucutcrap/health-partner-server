/**
 * 小程序用户数据模型
 */
const { database } = require('../../core')

// 创建用户表的数据库操作函数
const userDb = database.createDbOperations('users')

/**
 * 根据 openId 查找用户
 */
async function findByOpenId(openId) {
  const sql = 'SELECT * FROM users WHERE openid = ?'
  return await userDb.queryOne(sql, [openId])
}

/**
 * 根据 openId 创建或更新用户信息
 */
async function createOrUpdateByOpenId(openId, userData = {}) {
  const existingUser = await findByOpenId(openId);

  if (existingUser) {
    // 更新用户信息
    const updateFields = [];
    const updateValues = [];

    if (userData.nickname !== undefined) {
      updateFields.push("nickname = ?");
      updateValues.push(userData.nickname);
    }
    if (userData.avatar_url !== undefined) {
      updateFields.push("avatar_url = ?");
      updateValues.push(userData.avatar_url);
    }
    if (userData.height !== undefined) {
      updateFields.push("height = ?");
      updateValues.push(userData.height);
    }
    if (userData.weight !== undefined) {
      updateFields.push("weight = ?");
      updateValues.push(userData.weight);
    }
    if (userData.age !== undefined) {
      updateFields.push("age = ?");
      updateValues.push(userData.age);
    }
    if (userData.gender !== undefined) {
      updateFields.push("gender = ?");
      updateValues.push(userData.gender);
    }
    // 注意：member_expire_at 通常通过支付回调更新，但也允许在此更新
    if (userData.member_expire_at !== undefined) {
      updateFields.push("member_expire_at = ?");
      updateValues.push(userData.member_expire_at);
    }

    if (updateFields.length > 0) {
      updateValues.push(openId);
      const sql = `UPDATE users SET ${updateFields.join(
        ", "
      )}, updated_at = NOW() WHERE openid = ?`;
      await userDb.query(sql, updateValues);
      return await findByOpenId(openId);
    }

    return existingUser;
  } else {
    // 创建新用户
    const insertData = {
      openid: openId,
      nickname: userData.nickname || null,
      avatar_url: userData.avatar_url || null,
      height: userData.height || null,
      weight: userData.weight || null,
      age: userData.age || null,
      gender: userData.gender || null,
      member_expire_at: null
    };
    await userDb.create(insertData);
    return await findByOpenId(openId);
  }
}

module.exports = {
  findByOpenId,
  createOrUpdateByOpenId
}
