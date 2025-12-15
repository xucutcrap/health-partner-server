-- 官方渠道支持数据库迁移脚本
-- 执行时间: 2025-12-15
-- 说明: 修改share_referrals表的share_id字段允许为NULL，以支持官方渠道推广（无具体推荐人）

-- 1. 先删除外键约束
ALTER TABLE share_referrals 
DROP FOREIGN KEY fk_share_referrals_share_id;

-- 2. 修改share_id字段允许为NULL
ALTER TABLE share_referrals 
MODIFY COLUMN share_id int(11) DEFAULT NULL COMMENT '对应的分享记录ID，来自user_shares表的id。为NULL表示官方渠道推广';

-- 3. 重新添加外键约束（允许NULL值）
ALTER TABLE share_referrals 
ADD CONSTRAINT fk_share_referrals_share_id 
FOREIGN KEY (share_id) REFERENCES user_shares(id) ON DELETE SET NULL;

-- 4. 验证修改是否成功
DESC share_referrals;

