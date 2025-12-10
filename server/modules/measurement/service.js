/**
 * 身体围度服务
 */
const healthRecordModel = require('../user/health-record-model')
const userModel = require('../user/model')
const { BusinessError } = require('../../core/errors')

/**
 * 保存围度记录
 * @param {string} openId 用户OpenID
 * @param {Object} data 记录数据 { date, type, value }
 */
async function saveMeasurement(openId, data) {
  const user = await userModel.findByOpenId(openId)
  if (!user) {
    throw new BusinessError('用户不存在')
  }

  const { date, type, value } = data
  
  if (!['bust', 'waist', 'hip', 'arm', 'thigh', 'calf'].includes(type)) {
    throw new BusinessError('无效的围度类型')
  }

  // 构造健康记录数据
  // 复用 health_records 表
  // record_type 存 'bust', 'waist', 'hip', 'arm', 'thigh', 'calf'
  // unit 默认为 'cm'
  const recordData = {
    userId: user.id,
    recordType: type,
    value: parseFloat(value),
    unit: 'cm',
    recordDate: date || new Date().toISOString().split('T')[0],
    recordTime: new Date().toTimeString().split(' ')[0]
  }

  return await healthRecordModel.create(recordData)
}

/**
 * 获取某段时间的围度记录
 */
async function getMeasurements(openId, startDate, endDate) {
  const user = await userModel.findByOpenId(openId)
  if (!user) {
    throw new BusinessError('用户不存在')
  }

  const records = await healthRecordModel.findByUserId(user.id, {
    startDate,
    endDate
    // 这里不限制 recordType，一次性拉取所有相关的，或者是分别拉取
  })

  // 过滤出围度数据
  const measurementRecords = records.filter(r => 
    ['bust', 'waist', 'hip', 'arm', 'thigh', 'calf'].includes(r.record_type)
  )

  return measurementRecords
}

/**
 * 获取今日围度数据 (用于页面初始化显示)
 */
async function getDailyMeasurements(openId, date) {
  const user = await userModel.findByOpenId(openId)
  if (!user) {
    throw new BusinessError('用户不存在')
  }

  const queryDate = date || new Date().toISOString().split('T')[0]
  
  // 获取当日的所有记录
  const records = await healthRecordModel.findByUserId(user.id, {
    startDate: queryDate,
    endDate: queryDate
  })

  // 整理为 { bust: val, waist: val, hip: val, arm: val, thigh: val, calf: val } 结构
  // 如果有多次记录，取最新的一条
  // records 默认是按时间倒序的，所以取第一个匹配的即可
  const result = {
    bust: null,
    waist: null,
    hip: null,
    arm: null,
    thigh: null,
    calf: null
  }

  for (const r of records) {
    if (result[r.record_type] === null && ['bust', 'waist', 'hip', 'arm', 'thigh', 'calf'].includes(r.record_type)) {
      result[r.record_type] = r.value
    }
  }

  return result
}

/**
 * 删除围度记录
 */
async function deleteMeasurement(openId, date, type) {
  const user = await userModel.findByOpenId(openId)
  if (!user) {
    throw new BusinessError('用户不存在')
  }

  const queryDate = date || new Date().toISOString().split('T')[0]
  
  // 查找符合条件的记录
  const records = await healthRecordModel.findByUserId(user.id, {
    startDate: queryDate,
    endDate: queryDate,
    recordType: type
  })
  
  if (records && records.length > 0) {
    // 可能会有多条，全部删除
    for (const record of records) {
      await healthRecordModel.deleteById(record.id, user.id)
    }
  }
  
  return { deleted: true }
}

/**
 * 获取最近的围度记录
 * @param {string} openId 用户OpenID
 * @param {number} limit 返回记录数量
 */
async function getLatestMeasurements(openId, limit = 10) {
  const user = await userModel.findByOpenId(openId);
  if (!user) {
    throw new BusinessError('用户不存在');
  }

  // 定义所有围度类型
  const measurementTypes = ['bust', 'waist', 'hip', 'arm', 'thigh', 'calf'];
  
  // 初始化结果对象
  const result = {
    bust: [],
    waist: [],
    hip: [],
    arm: [],
    thigh: [],
    calf: []
  };
  
  // 为每种围度类型单独查询最近的记录
  for (const type of measurementTypes) {
    const typeRecords = await healthRecordModel.findByUserId(user.id, {
      excludeSteps: false,
      recordType: type, // 只查询当前围度类型
      limit: limit // 每种类型获取最近limit条记录
    });
    
    // 整理数据格式
    result[type] = typeRecords.map(record => ({
      id: record.id,
      date: record.record_date,
      value: record.value,
      unit: record.unit
    }));
  }

  return result;
}

// 导出新方法
module.exports = {
  saveMeasurement,
  getMeasurements,
  getDailyMeasurements,
  deleteMeasurement,
  getLatestMeasurements
}
