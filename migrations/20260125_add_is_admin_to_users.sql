-- 添加管理员字段到用户表
ALTER TABLE `users` ADD COLUMN `is_admin` tinyint(1) NOT NULL DEFAULT 0 COMMENT '管理员标识：1-管理员，0-普通用户';
