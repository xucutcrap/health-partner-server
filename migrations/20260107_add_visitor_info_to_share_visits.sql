-- 2026-01-07
-- 为 share_visits 表添加访问者信息字段

ALTER TABLE `share_visits` 
ADD COLUMN `visitor_openid` VARCHAR(50) COMMENT '访问者OpenID（谁访问了推广链接）',
ADD COLUMN `ip_address` VARCHAR(45) COMMENT '访问者IP地址（用于数据分析和防刷）';

-- 添加索引以提高查询效率
ALTER TABLE `share_visits` 
ADD INDEX `idx_visitor_openid` (`visitor_openid`);
