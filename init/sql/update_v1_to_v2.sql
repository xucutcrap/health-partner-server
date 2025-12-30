-- 1. 扩展 users 表
ALTER TABLE `users`
ADD COLUMN `height` decimal(5,2) DEFAULT NULL COMMENT '身高(cm)',
ADD COLUMN `weight` decimal(5,2) DEFAULT NULL COMMENT '体重(kg)',
ADD COLUMN `age` int(11) DEFAULT NULL COMMENT '年龄',
ADD COLUMN `gender` varchar(10) DEFAULT '男' COMMENT '性别',
ADD COLUMN `member_expire_at` DATETIME DEFAULT NULL COMMENT '会员过期时间';

-- 2. 数据迁移: 将 user_profiles 中的数据合并到 users 表
-- 使用 UPDATE JOIN 确保数据准确对应
UPDATE `users` u
JOIN `user_profiles` p ON u.id = p.user_id
SET 
  u.height = p.height,
  u.weight = p.weight,
  u.age = p.age,
  u.gender = p.gender;

-- 3. 创建会员订单表
CREATE TABLE IF NOT EXISTS `member_orders` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL COMMENT '用户ID',
  `order_no` varchar(64) NOT NULL COMMENT '系统订单号',
  `transaction_id` varchar(64) DEFAULT NULL COMMENT '微信支付单号',
  `product_id` varchar(32) NOT NULL COMMENT '商品ID (month/quarter/year)',
  `product_name` varchar(64) NOT NULL COMMENT '商品名称',
  `amount` decimal(10,2) NOT NULL COMMENT '支付金额',
  `status` varchar(20) NOT NULL DEFAULT 'pending' COMMENT '状态: pending/success/fail',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `paid_at` datetime DEFAULT NULL COMMENT '支付时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_order_no` (`order_no`),
  KEY `idx_user_id` (`user_id`),
  CONSTRAINT `fk_member_orders_user_id` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='会员订单表';

-- 4. 验证数据无误后，手动删除 user_profiles 表 (可选)
-- DROP TABLE `user_profiles`;
