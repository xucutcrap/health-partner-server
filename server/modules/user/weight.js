// health-partner-server/server/modules/user/weight.js
// 体重记录相关业务逻辑

const { database } = require('../../core');
const userModel = require('./model');

const healthRecordDb = database.createDbOperations('health_records');

/**
 * 添加或更新体重记录
 * @param {string} openId - 用户openId
 * @param {number} weight - 体重值(kg)
 * @param {string} recordDate - 记录日期 YYYY-MM-DD
 * @returns {Promise<Object>}
 */
async function saveWeightRecord(openId, weight, recordDate) {
  try {
    // 1. 获取用户
    const user = await userModel.findByOpenId(openId);
    if (!user) {
      throw new Error('用户不存在');
    }

    const userId = user.id;

    // 2. 检查当天是否已有体重记录
    const sql = `SELECT id FROM health_records 
       WHERE user_id = ? AND record_type = 'weight' AND record_date = ?`;
    const existingRecords = await healthRecordDb.query(sql, [userId, recordDate]);

    let result;
    if (existingRecords && existingRecords.length > 0) {
      // 更新现有记录
      const updateSql = `UPDATE health_records 
         SET value = ?, unit = 'kg' 
         WHERE id = ?`;
      await healthRecordDb.query(updateSql, [weight, existingRecords[0].id]);

      return {
        success: true,
        message: '体重记录更新成功',
        data: {
          id: existingRecords[0].id,
          weight,
          recordDate
        }
      };
    } else {
      // 创建新记录
      const insertData = {
        user_id: userId,
        record_type: 'weight',
        value: weight,
        unit: 'kg',
        record_date: recordDate
      };
      
      result = await healthRecordDb.create(insertData);

      return {
        success: true,
        message: '体重记录添加成功',
        data: {
          id: result.id,
          weight,
          recordDate
        }
      };
    }
  } catch (error) {
    console.error('保存体重记录失败:', error);
    throw error;
  }
}

/**
 * 查询指定月份的体重记录
 * @param {string} openId - 用户openId
 * @param {number} year - 年份
 * @param {number} month - 月份 (1-12)
 * @returns {Promise<Array>}
 */
async function getWeightRecordsByMonth(openId, year, month) {
  try {
    // 1. 获取用户
    const user = await userModel.findByOpenId(openId);
    if (!user) {
      throw new Error('用户不存在');
    }

    const userId = user.id;

    // 2. 计算月份的起止日期
    const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
    const endDate = new Date(year, month, 0); // 获取该月最后一天
    const endDateStr = `${year}-${String(month).padStart(2, '0')}-${String(endDate.getDate()).padStart(2, '0')}`;

    // 3. 查询该月的体重记录
    const sql = `SELECT 
        id,
        DATE_FORMAT(record_date, '%Y-%m-%d') as date,
        value as weight,
        DATE_FORMAT(created_at, '%Y-%m-%d %H:%i:%s') as createdAt
       FROM health_records 
       WHERE user_id = ? 
         AND record_type = 'weight' 
         AND record_date >= ? 
         AND record_date <= ?
       ORDER BY record_date ASC`;
    
    const records = await healthRecordDb.query(sql, [userId, startDate, endDateStr]);

    return {
      success: true,
      data: records || []
    };
  } catch (error) {
    console.error('查询体重记录失败:', error);
    throw error;
  }
}

/**
 * 删除体重记录
 * @param {string} openId - 用户openId
 * @param {number} recordId - 记录ID
 * @returns {Promise<Object>}
 */
async function deleteWeightRecord(openId, recordId) {
  try {
    // 1. 获取用户
    const user = await userModel.findByOpenId(openId);
    if (!user) {
      throw new Error('用户不存在');
    }

    const userId = user.id;

    // 2. 验证记录是否属于该用户
    const checkSql = `SELECT id FROM health_records 
       WHERE id = ? AND user_id = ? AND record_type = 'weight'`;
    const recordCheck = await healthRecordDb.query(checkSql, [recordId, userId]);

    if (!recordCheck || recordCheck.length === 0) {
      throw new Error('记录不存在或无权限删除');
    }

    // 3. 删除记录
    const deleteSql = 'DELETE FROM health_records WHERE id = ?';
    await healthRecordDb.query(deleteSql, [recordId]);

    return {
      success: true,
      message: '体重记录删除成功'
    };
  } catch (error) {
    console.error('删除体重记录失败:', error);
    throw error;
  }
}

/**
 * 获取最近的体重记录
 * @param {string} openId - 用户openId
 * @param {number} limit - 返回记录数量
 * @returns {Promise<Array>}
 */
async function getLatestWeightRecords(openId, limit = 10) {
  try {
    // 1. 获取用户
    const user = await userModel.findByOpenId(openId);
    if (!user) {
      throw new Error('用户不存在');
    }

    const userId = user.id;

    // 2. 查询最近的体重记录
    const sql = `SELECT 
        id, record_date as date, value as weight, unit
      FROM health_records 
      WHERE user_id = ? AND record_type = 'weight' 
      ORDER BY record_date DESC, record_time DESC 
      LIMIT ?`;
    
    const records = await healthRecordDb.query(sql, [userId, limit]);

    // 3. 转换数据格式
    const result = records.map(record => ({
      id: record.id,
      date: record.date,
      weight: record.weight,
      unit: record.unit
    })).reverse(); // 按时间正序返回

    return {
      success: true,
      data: result
    };
  } catch (error) {
    console.error('获取最近体重记录失败:', error);
    throw error;
  }
}

// 导出新方法
module.exports = {
  saveWeightRecord,
  getWeightRecordsByMonth,
  deleteWeightRecord,
  getLatestWeightRecords
};
