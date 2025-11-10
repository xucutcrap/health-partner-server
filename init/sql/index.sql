-- 创建数据库，请根据实际情况替换数据库名
CREATE DATABASE IF NOT EXISTS `health_partner` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `health_partner`;

-- 1. 用户表 (users) - 小程序用户
CREATE TABLE IF NOT EXISTS `users` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `openid` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '微信OpenID，唯一标识',
  `nickname` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '微信昵称',
  `avatar_url` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '微信头像',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_users_openid` (`openid`) COMMENT '确保OpenID唯一'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户表';

-- 2. 用户健康档案表 (user_profiles)
CREATE TABLE IF NOT EXISTS `user_profiles` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL COMMENT '用户ID',
  `height` decimal(5,2) DEFAULT NULL COMMENT '身高(cm)',
  `weight` decimal(5,2) DEFAULT NULL COMMENT '体重(kg)',
  `age` int(11) DEFAULT NULL COMMENT '年龄',
  `gender` varchar(10) COLLATE utf8mb4_unicode_ci DEFAULT '男' COMMENT '性别：男/女',
  `body_fat` decimal(5,2) DEFAULT NULL COMMENT '体脂率(%)',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_user_profiles_user_id` (`user_id`),
  CONSTRAINT `fk_user_profiles_user_id` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户健康档案表';

-- 3. 用户目标设置表 (user_goals)
CREATE TABLE IF NOT EXISTS `user_goals` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL COMMENT '用户ID',
  `target_calories` int(11) DEFAULT 2000 COMMENT '目标卡路里(大卡)',
  `target_exercise` int(11) DEFAULT 30 COMMENT '目标运动时长(分钟)',
  `target_water` int(11) DEFAULT 8 COMMENT '目标饮水量(杯)',
  `target_weight` decimal(5,2) DEFAULT NULL COMMENT '目标体重(kg)',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_user_goals_user_id` (`user_id`),
  CONSTRAINT `fk_user_goals_user_id` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户目标设置表';

-- 4. 饮食记录表 (diet_records)
CREATE TABLE IF NOT EXISTS `diet_records` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL COMMENT '用户ID',
  `meal_type` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '餐次：早餐/午餐/晚餐/加餐',
  `food_name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '食物名称',
  `calories` int(11) NOT NULL DEFAULT 0 COMMENT '热量(大卡)',
  `protein` decimal(5,2) DEFAULT 0 COMMENT '蛋白质(g)',
  `carbs` decimal(5,2) DEFAULT 0 COMMENT '碳水化合物(g)',
  `fat` decimal(5,2) DEFAULT 0 COMMENT '脂肪(g)',
  `fiber` decimal(5,2) DEFAULT 0 COMMENT '纤维(g)',
  `record_date` date NOT NULL COMMENT '记录日期',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`id`),
  KEY `idx_diet_records_user_id` (`user_id`),
  KEY `idx_diet_records_date` (`record_date`),
  CONSTRAINT `fk_diet_records_user_id` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='饮食记录表';

-- 5. 运动记录表 (exercise_records)
CREATE TABLE IF NOT EXISTS `exercise_records` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL COMMENT '用户ID',
  `exercise_type` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '运动类型：跑步/游泳/骑行/瑜伽/力量训练等',
  `duration` int(11) NOT NULL COMMENT '运动时长(分钟)',
  `calories` int(11) NOT NULL DEFAULT 0 COMMENT '消耗热量(大卡)',
  `distance` decimal(6,2) DEFAULT NULL COMMENT '距离(km)，适用于跑步、骑行等',
  `record_date` date NOT NULL COMMENT '记录日期',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`id`),
  KEY `idx_exercise_records_user_id` (`user_id`),
  KEY `idx_exercise_records_date` (`record_date`),
  CONSTRAINT `fk_exercise_records_user_id` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='运动记录表';

-- 6. 健康体征记录表 (health_records)
CREATE TABLE IF NOT EXISTS `health_records` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL COMMENT '用户ID',
  `record_type` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '记录类型：血压/心率/体重/血糖/体温',
  `systolic` int(11) DEFAULT NULL COMMENT '收缩压(仅血压类型)',
  `diastolic` int(11) DEFAULT NULL COMMENT '舒张压(仅血压类型)',
  `value` decimal(6,2) NOT NULL COMMENT '记录值',
  `unit` varchar(10) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '单位：mmHg/bpm/kg/mmol/L/℃',
  `record_date` date NOT NULL COMMENT '记录日期',
  `record_time` time DEFAULT NULL COMMENT '记录时间',
  `note` varchar(200) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '备注',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`id`),
  KEY `idx_health_records_user_id` (`user_id`),
  KEY `idx_health_records_type` (`record_type`),
  KEY `idx_health_records_date` (`record_date`),
  CONSTRAINT `fk_health_records_user_id` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='健康体征记录表';

-- 7. 饮水记录表 (water_records)
CREATE TABLE IF NOT EXISTS `water_records` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL COMMENT '用户ID',
  `amount` int(11) NOT NULL DEFAULT 1 COMMENT '饮水量(杯)',
  `record_date` date NOT NULL COMMENT '记录日期',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`id`),
  KEY `idx_water_records_user_id` (`user_id`),
  KEY `idx_water_records_date` (`record_date`),
  CONSTRAINT `fk_water_records_user_id` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='饮水记录表';
