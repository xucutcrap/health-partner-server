-- 创建数据库，请根据实际情况替换数据库名
CREATE DATABASE IF NOT EXISTS `yoga_platform` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `yoga_platform`;

-- 1. 租户表/场馆表 (tenants)
CREATE TABLE `tenants` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '场馆名称',
  `invite_code` varchar(10) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '唯一邀请码，用于小程序扫码绑定',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_tenants_invite_code` (`invite_code`) -- 邀请码必须唯一
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='租户表/场馆表';

-- 2. 用户表 (users) - 小程序用户
CREATE TABLE `users` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `openid` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '微信OpenID，唯一标识',
  `nickname` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '微信昵称',
  `avatar_url` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '微信头像',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_users_openid` (`openid`) -- 确保OpenID唯一
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户表';

-- 3. 用户-租户关联表 (user_tenant_relations) - 记录用户属于哪个场馆
CREATE TABLE `user_tenant_relations` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL COMMENT '用户ID',
  `tenant_id` int(11) NOT NULL COMMENT '租户ID',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_user_tenant` (`user_id`,`tenant_id`) COMMENT '同一个用户不能重复关联同一个场馆',
  KEY `fk_user_tenant_relation_tenant_id` (`tenant_id`),
  CONSTRAINT `fk_user_tenant_relation_tenant_id` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_user_tenant_relation_user_id` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户-租户关联表';

-- 4. 老师表 (teachers)
CREATE TABLE `teachers` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `tenant_id` int(11) NOT NULL COMMENT '所属租户',
  `name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '老师姓名',
  `phone` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '联系电话',
  `specialty` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '擅长领域',
  `description` text COLLATE utf8mb4_unicode_ci COMMENT '老师描述',
  `status` enum('active','inactive') COLLATE utf8mb4_unicode_ci DEFAULT 'active' COMMENT '状态: active(激活), inactive(未激活)',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fk_teachers_tenant_id` (`tenant_id`),
  CONSTRAINT `fk_teachers_tenant_id` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='老师表';

-- 5. 课程表 (courses) - 修改为使用teacher_id外键
CREATE TABLE `courses` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `tenant_id` int(11) NOT NULL COMMENT '所属租户',
  `teacher_id` int(11) NOT NULL COMMENT '老师ID',
  `title` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '课程标题',
  `schedule_time` datetime NOT NULL COMMENT '课程开始时间',
  `duration` int(11) NOT NULL DEFAULT '60' COMMENT '课程时长（分钟）',
  `capacity` int(11) NOT NULL DEFAULT '0' COMMENT '课程容量',
  `type` enum('group','private') COLLATE utf8mb4_unicode_ci DEFAULT 'group' COMMENT '课程类型: group(团课), private(私教)',
  `description` text COLLATE utf8mb4_unicode_ci COMMENT '课程描述',
  `location` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '上课地点',
  `booked_count` int(11) NOT NULL COMMENT '预约人数',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_courses_tenant_id` (`tenant_id`),
  KEY `idx_courses_schedule_time` (`schedule_time`) COMMENT '基于时间的查询和排序',
  KEY `fk_courses_teacher_id` (`teacher_id`),
  CONSTRAINT `fk_courses_tenant_id` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_courses_teacher_id` FOREIGN KEY (`teacher_id`) REFERENCES `teachers` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='课程表';

-- 5. 会员卡类型表 (member_card_types) - 可扩展：用于后台配置卡类型
CREATE TABLE `member_card_types` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `tenant_id` int(11) NOT NULL COMMENT '所属租户',
  `name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '卡片名称（如：30次次卡）',
  `type` enum('count','period') COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '类型: count(次卡), period(期限卡)',
  `total_count` int(11) DEFAULT NULL COMMENT '总次数（次卡专用）',
  `valid_days` int(11) NOT NULL COMMENT '有效天数',
  `price` DECIMAL(10,2) DEFAULT NULL COMMENT '价格',
  `description` text COLLATE utf8mb4_unicode_ci COMMENT '会员卡描述',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fk_member_card_types_tenant_id` (`tenant_id`),
  CONSTRAINT `fk_member_card_types_tenant_id` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='会员卡类型表';

-- 6. 会员卡表 (member_cards) - 用户实际拥有的卡
CREATE TABLE `member_cards` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL COMMENT '用户ID',
  `tenant_id` int(11) NOT NULL COMMENT '租户ID',
  `type_id` int(11) NOT NULL COMMENT '卡类型ID',
  `remaining_count` int(11) DEFAULT NULL COMMENT '剩余次数（次卡专用）',
  `frozen_count` int(11) NOT NULL DEFAULT '0' COMMENT '冻结次数（次卡专用）',
  `activated_at` datetime DEFAULT NULL COMMENT '激活时间，开始计算有效期',
  `expires_at` datetime DEFAULT NULL COMMENT '到期时间',
  `status` enum('inactive','active','expired') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'inactive' COMMENT '状态: inactive(未激活), active(有效), expired(已过期)',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_member_cards_user_tenant` (`user_id`,`tenant_id`) COMMENT '查询用户在某场馆下的卡',
  KEY `idx_member_cards_status` (`status`),
  KEY `fk_member_cards_tenant_id` (`tenant_id`),
  KEY `fk_member_cards_type_id` (`type_id`),
  CONSTRAINT `fk_member_cards_tenant_id` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_member_cards_type_id` FOREIGN KEY (`type_id`) REFERENCES `member_card_types` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_member_cards_user_id` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='会员卡表';

-- 7. 预约记录表 (bookings) - 核心业务表
CREATE TABLE `bookings` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL COMMENT '用户ID',
  `course_id` int(11) NOT NULL COMMENT '课程ID',
  `tenant_id` int(11) NOT NULL COMMENT '租户ID（冗余存储，便于查询）',
  `member_card_id` int(11) NOT NULL COMMENT '使用的会员卡ID',
  `status` enum('booked','attended','cancelled','no_show') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'booked' COMMENT '状态: booked(已预约), attended(已出席), cancelled(已取消), no_show(爽约)',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_bookings_user_course` (`user_id`,`course_id`) COMMENT '防止用户重复预约同一课程',
  KEY `idx_bookings_course_id` (`course_id`),
  KEY `idx_bookings_tenant_id` (`tenant_id`),
  KEY `idx_bookings_member_card_id` (`member_card_id`),
  CONSTRAINT `fk_bookings_course_id` FOREIGN KEY (`course_id`) REFERENCES `courses` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_bookings_member_card_id` FOREIGN KEY (`member_card_id`) REFERENCES `member_cards` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_bookings_tenant_id` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_bookings_user_id` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='预约记录表';

-- 管理员
CREATE TABLE `admins` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `username` VARCHAR(50) NOT NULL UNIQUE COMMENT '管理员用户名',
  `password` VARCHAR(255) NOT NULL COMMENT '加密后的密码',
  `name` VARCHAR(255) NOT NULL COMMENT '管理员姓名',
  `role` VARCHAR(20) DEFAULT 'admin' COMMENT '角色',
  `last_login` DATETIME COMMENT '最后登录时间',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 创建管理员-租户关联表（多对多关系）
CREATE TABLE `admin_tenant_relations` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `admin_id` INT NOT NULL COMMENT '管理员ID',
  `tenant_id` INT NOT NULL COMMENT '租户ID',
  `is_default` TINYINT(1) DEFAULT 0 COMMENT '是否为默认租户',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY `unique_admin_tenant` (`admin_id`, `tenant_id`),
  FOREIGN KEY (`admin_id`) REFERENCES `admins` (`id`) ON DELETE CASCADE,
  FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB COMMENT='管理员-租户关联表';


-- 插入默认租户/场馆
INSERT INTO `tenants` (`name`, `invite_code`) VALUES 
('悦瑜伽馆', 'YUEGA001');

-- 初始化管理员 admin / 123
INSERT INTO `admins` (`username`, `password`, `name`, `role`) VALUES 
('admin', '$2a$10$XqHEVRgL.9UkQwPpAdyY/.s2IC3LwslKA0bLWcOyGBf0xx3ukjpHy', '系统管理员', 'admin');

-- 假设管理员ID=1，租户ID=1
INSERT INTO `admin_tenant_relations` (`admin_id`, `tenant_id`, `is_default`) 
VALUES (1, 1, 1);


