-- health-partner-server/init/sql/init_complete.sql
-- 完整的数据库初始化脚本（用于生产环境）
-- 执行顺序：先创建基础表，再创建扩展表，最后添加字段

-- ============================================
-- 第一部分：创建数据库和基础表
-- ============================================

-- 创建数据库
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
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_user_profiles_user_id` (`user_id`),
  CONSTRAINT `fk_user_profiles_user_id` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户健康档案表';

-- 3. 用户目标设置表 (user_goals) - 基础字段
CREATE TABLE IF NOT EXISTS `user_goals` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL COMMENT '用户ID',
  `target_weight` decimal(5,2) DEFAULT NULL COMMENT '目标体重(kg)',
  `target_exercise` int(11) DEFAULT 30 COMMENT '目标运动时长(分钟)',
  `target_calories` int(11) DEFAULT 2000 COMMENT '目标卡路里(大卡)',
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
  `food_id` int(11) DEFAULT NULL COMMENT '食物ID（关联foods表）',
  `food_icon` varchar(10) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '食物图标',
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
  KEY `idx_diet_records_food_id` (`food_id`),
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

-- 7. 饮水记录表 (water_records) - 保留但不使用
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

-- ============================================
-- 第二部分：扩展 user_goals 表字段
-- ============================================

-- 添加 target_steps 字段（如果不存在）
SET @dbname = DATABASE();
SET @tablename = 'user_goals';
SET @columnname = 'target_steps';
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      (table_name = @tablename)
      AND (table_schema = @dbname)
      AND (column_name = @columnname)
  ) > 0,
  'SELECT 1',
  CONCAT('ALTER TABLE ', @tablename, ' ADD COLUMN ', @columnname, ' int(11) DEFAULT 10000 COMMENT ''目标步数(步)'' AFTER `target_weight`')
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- 添加 target_date 字段（如果不存在）
SET @columnname = 'target_date';
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      (table_name = @tablename)
      AND (table_schema = @dbname)
      AND (column_name = @columnname)
  ) > 0,
  'SELECT 1',
  CONCAT('ALTER TABLE ', @tablename, ' ADD COLUMN ', @columnname, ' date DEFAULT NULL COMMENT ''目标日期'' AFTER `target_steps`')
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- 添加 target_calories_burned 字段（如果不存在）
SET @columnname = 'target_calories_burned';
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      (table_name = @tablename)
      AND (table_schema = @dbname)
      AND (column_name = @columnname)
  ) > 0,
  'SELECT 1',
  CONCAT('ALTER TABLE ', @tablename, ' ADD COLUMN ', @columnname, ' int(11) DEFAULT 500 COMMENT ''目标消耗卡路里(大卡)'' AFTER `target_calories`')
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- 添加 target_calories_rest_day 字段（如果不存在）
SET @columnname = 'target_calories_rest_day';
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      (table_name = @tablename)
      AND (table_schema = @dbname)
      AND (column_name = @columnname)
  ) > 0,
  'SELECT 1',
  CONCAT('ALTER TABLE ', @tablename, ' ADD COLUMN ', @columnname, ' int(11) DEFAULT NULL COMMENT ''非运动日目标热量摄入(大卡)'' AFTER `target_calories_burned`')
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- 添加 target_calories_exercise_day 字段（如果不存在）
SET @columnname = 'target_calories_exercise_day';
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      (table_name = @tablename)
      AND (table_schema = @dbname)
      AND (column_name = @columnname)
  ) > 0,
  'SELECT 1',
  CONCAT('ALTER TABLE ', @tablename, ' ADD COLUMN ', @columnname, ' int(11) DEFAULT NULL COMMENT ''运动日目标热量摄入(大卡)'' AFTER `target_calories_rest_day`')
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- ============================================
-- 第三部分：创建食物相关表
-- ============================================

-- 食物分类表
CREATE TABLE IF NOT EXISTS `food_categories` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(50) NOT NULL COMMENT '分类名称：主食/蔬菜/肉类/水果等',
  `icon` varchar(10) DEFAULT NULL COMMENT '图标emoji',
  `sort_order` int(11) DEFAULT 0 COMMENT '排序',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='食物分类表';

-- 食物表
CREATE TABLE IF NOT EXISTS `foods` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `category_id` int(11) NOT NULL COMMENT '分类ID',
  `name` varchar(100) NOT NULL COMMENT '食物名称',
  `icon` varchar(10) DEFAULT NULL COMMENT '图标emoji',
  `calories_per_100g` decimal(6,2) NOT NULL COMMENT '每100g卡路里',
  `protein_per_100g` decimal(5,2) DEFAULT 0 COMMENT '每100g蛋白质(g)',
  `carbs_per_100g` decimal(5,2) DEFAULT 0 COMMENT '每100g碳水化合物(g)',
  `fat_per_100g` decimal(5,2) DEFAULT 0 COMMENT '每100g脂肪(g)',
  `fiber_per_100g` decimal(5,2) DEFAULT 0 COMMENT '每100g纤维(g)',
  `sort_order` int(11) DEFAULT 0 COMMENT '排序',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_foods_category_id` (`category_id`),
  CONSTRAINT `fk_foods_category_id` FOREIGN KEY (`category_id`) REFERENCES `food_categories` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='食物表';

-- 食物单位表
CREATE TABLE IF NOT EXISTS `food_units` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `food_id` int(11) NOT NULL COMMENT '食物ID',
  `unit_name` varchar(50) NOT NULL COMMENT '单位名称：圆饭盒/方饭盒/大/中/小等',
  `weight_grams` decimal(6,2) NOT NULL COMMENT '对应重量(克)',
  `sort_order` int(11) DEFAULT 0 COMMENT '排序',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_food_units_food_id` (`food_id`),
  CONSTRAINT `fk_food_units_food_id` FOREIGN KEY (`food_id`) REFERENCES `foods` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='食物单位表';

-- ============================================
-- 第四部分：创建帖子相关表
-- ============================================

-- 帖子表
CREATE TABLE IF NOT EXISTS `posts` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL COMMENT '发布用户ID',
  `content` text COLLATE utf8mb4_unicode_ci COMMENT '帖子内容',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  KEY `idx_posts_user_id` (`user_id`),
  KEY `idx_posts_created_at` (`created_at`),
  CONSTRAINT `fk_posts_user_id` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='社交帖子表';

-- 帖子图片表
CREATE TABLE IF NOT EXISTS `post_images` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `post_id` int(11) NOT NULL COMMENT '帖子ID',
  `image_url` varchar(500) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '图片URL',
  `sort_order` int(11) DEFAULT 0 COMMENT '图片排序',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_post_images_post_id` (`post_id`),
  CONSTRAINT `fk_post_images_post_id` FOREIGN KEY (`post_id`) REFERENCES `posts` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='帖子图片表';

-- 帖子点赞表
CREATE TABLE IF NOT EXISTS `post_likes` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `post_id` int(11) NOT NULL COMMENT '帖子ID',
  `user_id` int(11) NOT NULL COMMENT '点赞用户ID',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_post_user` (`post_id`, `user_id`),
  KEY `idx_post_likes_post_id` (`post_id`),
  KEY `idx_post_likes_user_id` (`user_id`),
  CONSTRAINT `fk_post_likes_post_id` FOREIGN KEY (`post_id`) REFERENCES `posts` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_post_likes_user_id` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='帖子点赞表';

-- 帖子评论表
CREATE TABLE IF NOT EXISTS `post_comments` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `post_id` int(11) NOT NULL COMMENT '帖子ID',
  `user_id` int(11) NOT NULL COMMENT '评论用户ID',
  `parent_id` int(11) DEFAULT NULL COMMENT '父评论ID（一级评论为NULL，二级评论指向一级评论ID）',
  `reply_to_user_id` int(11) DEFAULT NULL COMMENT '回复的用户ID（二级评论时，记录被回复的用户ID）',
  `content` text COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '评论内容',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  KEY `idx_post_comments_post_id` (`post_id`),
  KEY `idx_post_comments_user_id` (`user_id`),
  KEY `idx_post_comments_parent_id` (`parent_id`),
  CONSTRAINT `fk_post_comments_post_id` FOREIGN KEY (`post_id`) REFERENCES `posts` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_post_comments_user_id` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_post_comments_parent_id` FOREIGN KEY (`parent_id`) REFERENCES `post_comments` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_post_comments_reply_to_user_id` FOREIGN KEY (`reply_to_user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='帖子评论表';

