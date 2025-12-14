-- 渠道溯源功能数据库迁移脚本
-- 执行时间: 2025-12-14
-- 说明: 为share_referrals表添加channel字段,用于记录用户来源渠道

-- 1. 添加渠道字段
ALTER TABLE share_referrals 
ADD COLUMN channel VARCHAR(50) DEFAULT NULL COMMENT '渠道来源:wechat/xiaohongshu/douyin';

-- 2. 添加索引以优化查询性能
CREATE INDEX idx_channel ON share_referrals(channel);

-- 3. 验证字段是否添加成功
SHOW COLUMNS FROM share_referrals LIKE 'channel';

-- 4. 查看表结构
DESC share_referrals;
