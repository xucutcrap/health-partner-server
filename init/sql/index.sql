-- 创建数据库，请根据实际情况替换数据库名
CREATE DATABASE IF NOT EXISTS `health_partner` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `health_partner`;

-- 1. 用户表 (users) - 小程序用户
CREATE TABLE IF NOT EXISTS `users` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `openid` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '微信OpenID，唯一标识',
  `nickname` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '微信昵称',
  `avatar_url` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '微信头像',
  `height` decimal(5,2) DEFAULT NULL COMMENT '身高(cm)',
  `weight` decimal(5,2) DEFAULT NULL COMMENT '体重(kg)',
  `age` int(11) DEFAULT NULL COMMENT '年龄',
  `gender` varchar(10) COLLATE utf8mb4_unicode_ci DEFAULT '男' COMMENT '性别：男/女',
  `member_expire_at` datetime DEFAULT NULL COMMENT '会员过期时间',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_users_openid` (`openid`) COMMENT '确保OpenID唯一'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户表';

-- 2. 用户健康档案表 (user_profiles) - 已废弃，合并至 users 表
-- CREATE TABLE IF NOT EXISTS `user_profiles` ...

-- 3. 用户目标设置表 (user_goals)
CREATE TABLE IF NOT EXISTS `user_goals` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL COMMENT '用户ID',
  `target_calories` int(11) DEFAULT 2000 COMMENT '目标卡路里(大卡)',
  `target_exercise` int(11) DEFAULT 30 COMMENT '目标运动时长(分钟)',
  `target_water` int(11) DEFAULT 8 COMMENT '目标饮水量(杯)',
  `target_weight` decimal(5,2) DEFAULT NULL COMMENT '目标体重(kg)',
  `target_steps` int(11) DEFAULT 10000 COMMENT '目标步数(步)',
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

-- 8. 分享记录表 (share_records)
CREATE TABLE IF NOT EXISTS `user_shares` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL COMMENT '用户ID',
  `share_scene` tinyint(2) NOT NULL COMMENT '分享场景：1-分享给好友，2-分享到朋友圈',
  `share_page` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '分享的页面路径，如：pages/index/index',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`id`),
  KEY `idx_user_id` (`user_id`) COMMENT '用户索引',
  KEY `idx_created_at` (`created_at`) COMMENT '时间索引',
  KEY `idx_share_scene` (`share_scene`) COMMENT '分享场景索引',
  CONSTRAINT `fk_user_shares_user_id` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户分享记录表';

--9. 分享推荐新用户记录表（share_referrals）
CREATE TABLE IF NOT EXISTS `share_referrals` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `share_id` int(11) NOT NULL COMMENT '对应的分享记录ID，来自user_shares表的id',
  `referred_user_id` int(11) NOT NULL COMMENT '通过分享链接注册的新用户ID',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_referred_user_id` (`referred_user_id`) COMMENT '确保每个新用户只能被记录一次（假设一个用户只能通过一个分享链接注册）',
  KEY `idx_share_id` (`share_id`) COMMENT '分享记录索引，方便统计每次分享带来的用户',
  KEY `idx_created_at` (`created_at`) COMMENT '时间索引',
  CONSTRAINT `fk_share_referrals_share_id` FOREIGN KEY (`share_id`) REFERENCES `user_shares` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_share_referrals_referred_user_id` FOREIGN KEY (`referred_user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='分享推荐新用户记录表';

--10. 用户反馈表（feedback）
CREATE TABLE `feedback` (
  `id` int(11) NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `content` text NOT NULL COMMENT '反馈内容',
  `contact` varchar(100) DEFAULT NULL COMMENT '联系方式',
  `user_id` int(11) DEFAULT NULL COMMENT '用户ID',
  `create_time` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`id`),
  KEY `idx_create_time` (`create_time`),
  KEY `idx_user_id` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户反馈表';

--11. 食谱表（recipes）
CREATE TABLE recipes (
    -- 基本信息
    id INT PRIMARY KEY COMMENT '食谱唯一ID（对应JSON中的id）',
    name VARCHAR(255) NOT NULL COMMENT '食谱名称（对应JSON中的name）',
    intro TEXT COMMENT '食谱详细介绍（对应JSON中的intro）',
    pic_url VARCHAR(500) COMMENT '食谱图片URL（对应JSON中的pic）',
    promotion VARCHAR(255) COMMENT '宣传语/标语（对应JSON中的promotion）',
    
    -- 使用统计信息
    display_count INT DEFAULT 0 COMMENT '展示的累计使用人数（对应JSON中的displayCount）',
    footer VARCHAR(100) COMMENT '底部显示文本（如"428.8万人使用中"）（对应JSON中的footer）',
    
    -- 推荐标签
    recommend_text VARCHAR(50) COMMENT '推荐标签文本（如"热门"、"最新"、"最热"）（对应JSON中的recommendText）',
    
    -- 时间戳
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '最后更新时间',
    
    -- 索引定义
    INDEX idx_recipes_name (name) COMMENT '食谱名称索引',
    INDEX idx_recipes_display_count (display_count DESC) COMMENT '按展示人数排序索引',
    INDEX idx_recipes_recommend_text (recommend_text) COMMENT '推荐标签索引',
    INDEX idx_recipes_created_at (created_at DESC) COMMENT '创建时间索引'
) COMMENT='食谱主表，存储所有食谱的基本信息';

--12. 食谱分类表（recipe_groups）
CREATE TABLE recipe_groups (
    -- 基本信息
    group_id INT PRIMARY KEY COMMENT '分类唯一ID（对应JSON中的groupId）',
    group_name VARCHAR(100) NOT NULL COMMENT '分类名称（如"夏日瘦身"、"轻断食"）（对应JSON中的groupName）',
    
    -- 显示配置
    display_order INT DEFAULT 0 COMMENT '分类显示顺序（数值越小越靠前）',
    is_active TINYINT DEFAULT 1 COMMENT '是否启用（0=停用，1=启用）',
    
    -- 时间戳
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '最后更新时间',
    
    -- 约束与索引
    UNIQUE KEY uk_recipe_groups_name (group_name) COMMENT '分类名称唯一约束',
    INDEX idx_recipe_groups_display_order (display_order) COMMENT '显示顺序索引',
    INDEX idx_recipe_groups_is_active (is_active) COMMENT '启用状态索引'
) COMMENT='食谱分类表，存储所有食谱分类信息';

--13. 食谱与分类的关联表（recipe_group_relations）
CREATE TABLE recipe_group_relations (
    -- 主键
    id INT AUTO_INCREMENT PRIMARY KEY COMMENT '关联关系唯一ID',
    
    -- 外键关联
    recipe_id INT NOT NULL COMMENT '食谱ID，关联recipes.id',
    group_id INT NOT NULL COMMENT '分类ID，关联recipe_groups.group_id',
    
    -- 显示配置
    display_order INT DEFAULT 0 COMMENT '食谱在分类中的显示顺序（数值越小越靠前）',
    
    -- 时间戳
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    
    -- 约束与索引
    UNIQUE KEY uk_recipe_group_relations_unique (recipe_id, group_id) COMMENT '食谱和分类组合唯一约束，防止重复关联',
    INDEX idx_recipe_group_relations_recipe_id (recipe_id) COMMENT '食谱ID索引，便于查询食谱的所有分类',
    INDEX idx_recipe_group_relations_group_id (group_id) COMMENT '分类ID索引，便于查询分类下的所有食谱',
    INDEX idx_recipe_group_relations_display (group_id, display_order) COMMENT '按分类和显示顺序排序的索引，优化分类内排序查询',
    
    -- 外键约束（确保数据完整性）
    FOREIGN KEY (recipe_id) REFERENCES recipes(id) ON DELETE CASCADE,
    FOREIGN KEY (group_id) REFERENCES recipe_groups(group_id) ON DELETE CASCADE
) COMMENT='食谱与分类的关联表（多对多关系），用于支持一个食谱属于多个分类';

-- 14. 食谱日餐单表 - 存储食谱的每日餐单
CREATE TABLE recipe_daily_meals (
    id INT AUTO_INCREMENT PRIMARY KEY COMMENT '自增主键ID',
    recipe_id INT NOT NULL COMMENT '关联食谱ID',
    day_number SMALLINT NOT NULL COMMENT '第几天（1-13）',
    day_name VARCHAR(20) NOT NULL COMMENT '天数名称（如"第1天"、"第2天"）',
    total_calories INT COMMENT '总热量',
    display_order INT DEFAULT 0 COMMENT '显示顺序',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    
    UNIQUE KEY uk_recipe_day (recipe_id, day_number) COMMENT '食谱ID和天数组合唯一',
    INDEX idx_recipe_daily_meals_recipe (recipe_id),
    INDEX idx_recipe_daily_meals_day (day_number),
    FOREIGN KEY (recipe_id) REFERENCES recipes(id) ON DELETE CASCADE
) COMMENT='食谱日餐单表，存储食谱的每日餐单信息';

-- 15. 每日食物表 - 直接存储每天每餐的食物
CREATE TABLE daily_foods (
    id INT AUTO_INCREMENT PRIMARY KEY COMMENT '自增主键ID',
    daily_meal_id INT NOT NULL COMMENT '关联日餐单ID',
    meal_type VARCHAR(20) NOT NULL COMMENT '餐次类型（breakfast=早餐, lunch=午餐, dinner=晚餐, snack=加餐）',
    meal_name VARCHAR(50) COMMENT '餐次名称（如"早餐"、"午餐"）',
    meal_calories DECIMAL(8,2) COMMENT '餐次热量',
    food_name VARCHAR(200) NOT NULL COMMENT '食物名称',
    food_count DECIMAL(10,2) NOT NULL COMMENT '食物数量',
    unit VARCHAR(50) NOT NULL COMMENT '单位（如"克"、"个"、"盘"）',
    display_order INT DEFAULT 0 COMMENT '显示顺序',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    
    INDEX idx_daily_foods_daily_meal (daily_meal_id),
    INDEX idx_daily_foods_meal_type (meal_type),
    INDEX idx_daily_foods_display (daily_meal_id, meal_type, display_order),
    FOREIGN KEY (daily_meal_id) REFERENCES recipe_daily_meals(id) ON DELETE CASCADE
) COMMENT='每日食物表，直接存储每天每餐的食物信息';