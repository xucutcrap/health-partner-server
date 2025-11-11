-- 创建系统配置表
-- 用于存储系统级别的配置开关，如功能开关等

CREATE TABLE IF NOT EXISTS `system_config` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `config_key` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '配置键名',
  `config_value` varchar(500) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '配置值',
  `config_desc` varchar(200) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '配置描述',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_system_config_key` (`config_key`) COMMENT '确保配置键唯一'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='系统配置表';

-- 配置
INSERT INTO `system_config` (`config_key`, `config_value`, `config_desc`) 
VALUES ('comment_enabled', '0', '开关：0-关闭，1-开启')
ON DUPLICATE KEY UPDATE `config_value` = `config_value`;
