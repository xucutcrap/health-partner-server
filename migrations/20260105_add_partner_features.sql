-- 2026-01-05
-- 向 users 表添加合伙人标识
ALTER TABLE `users` ADD COLUMN `is_partner` TINYINT DEFAULT 0 COMMENT '是否是合伙人：0-否，1-是';

-- 创建推广访问记录表 (用于统计点击量)
CREATE TABLE IF NOT EXISTS `share_visits` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `promoter_id` int(11) NOT NULL COMMENT '推广员用户ID',
  `audit_status` tinyint(2) DEFAULT 0 COMMENT '访问状态(0-有效)',
  `visit_page` varchar(100) DEFAULT NULL COMMENT '访问页面',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '访问时间',
  PRIMARY KEY (`id`),
  KEY `idx_promoter_id` (`promoter_id`),
  KEY `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='推广链接访问记录表';
