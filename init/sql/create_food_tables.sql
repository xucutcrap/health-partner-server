-- 创建食物相关表
USE `health_partner`;

-- 1. 食物分类表
CREATE TABLE IF NOT EXISTS `food_categories` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '分类名称：主食/蔬菜/肉类/水果等',
  `icon` varchar(10) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '图标emoji',
  `sort_order` int(11) DEFAULT 0 COMMENT '排序',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_food_categories_sort` (`sort_order`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='食物分类表';

-- 2. 食物表
CREATE TABLE IF NOT EXISTS `foods` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `category_id` int(11) NOT NULL COMMENT '分类ID',
  `name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '食物名称',
  `icon` varchar(10) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '图标emoji',
  `calories_per_100g` decimal(6,2) NOT NULL COMMENT '每100g卡路里',
  `protein_per_100g` decimal(5,2) DEFAULT 0 COMMENT '每100g蛋白质(g)',
  `carbs_per_100g` decimal(5,2) DEFAULT 0 COMMENT '每100g碳水化合物(g)',
  `fat_per_100g` decimal(5,2) DEFAULT 0 COMMENT '每100g脂肪(g)',
  `fiber_per_100g` decimal(5,2) DEFAULT 0 COMMENT '每100g纤维(g)',
  `sort_order` int(11) DEFAULT 0 COMMENT '排序',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_foods_category_id` (`category_id`),
  KEY `idx_foods_sort` (`sort_order`),
  CONSTRAINT `fk_foods_category_id` FOREIGN KEY (`category_id`) REFERENCES `food_categories` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='食物表';

-- 3. 食物单位表
CREATE TABLE IF NOT EXISTS `food_units` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `food_id` int(11) NOT NULL COMMENT '食物ID',
  `unit_name` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '单位名称：圆饭盒/方饭盒/大/中/小等',
  `weight_grams` decimal(6,2) NOT NULL COMMENT '对应重量(克)',
  `sort_order` int(11) DEFAULT 0 COMMENT '排序',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_food_units_food_id` (`food_id`),
  KEY `idx_food_units_sort` (`sort_order`),
  CONSTRAINT `fk_food_units_food_id` FOREIGN KEY (`food_id`) REFERENCES `foods` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='食物单位表';



