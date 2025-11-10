-- 初始化食物数据
USE `health_partner`;

-- 1. 插入食物分类
INSERT INTO `food_categories` (`name`, `icon`, `sort_order`) VALUES
('主食', '🍚', 1),
('蔬菜', '🥦', 2),
('肉类', '🥩', 3),
('水果', '🍎', 4),
('饮品', '🥤', 5),
('零食', '🍪', 6)
ON DUPLICATE KEY UPDATE `name` = VALUES(`name`);

-- 2. 插入食物数据
-- 主食类
SET @category_main = (SELECT id FROM food_categories WHERE name = '主食' LIMIT 1);
INSERT INTO `foods` (`category_id`, `name`, `icon`, `calories_per_100g`, `protein_per_100g`, `carbs_per_100g`, `fat_per_100g`, `fiber_per_100g`, `sort_order`) VALUES
(@category_main, '米饭', '🍚', 116, 2.6, 25.9, 0.3, 0.3, 1),
(@category_main, '面条', '🍜', 109, 4.2, 22.1, 0.6, 0.8, 2),
(@category_main, '馒头', '🥖', 223, 7.0, 47.0, 1.1, 1.5, 3),
(@category_main, '包子', '🥠', 227, 7.3, 45.0, 1.2, 1.8, 4),
(@category_main, '饺子', '🥟', 229, 7.5, 35.0, 8.0, 2.0, 5),
(@category_main, '面包', '🍞', 312, 8.3, 58.1, 5.1, 2.3, 6),
(@category_main, '粥', '🥣', 46, 1.1, 9.9, 0.3, 0.2, 7)
ON DUPLICATE KEY UPDATE `name` = VALUES(`name`);

-- 蔬菜类
SET @category_veg = (SELECT id FROM food_categories WHERE name = '蔬菜' LIMIT 1);
INSERT INTO `foods` (`category_id`, `name`, `icon`, `calories_per_100g`, `protein_per_100g`, `carbs_per_100g`, `fat_per_100g`, `fiber_per_100g`, `sort_order`) VALUES
(@category_veg, '西兰花', '🥦', 25, 3.0, 4.0, 0.2, 2.6, 1),
(@category_veg, '西红柿', '🍅', 18, 0.9, 3.5, 0.2, 1.0, 2),
(@category_veg, '黄瓜', '🥒', 16, 0.7, 3.0, 0.1, 0.5, 3),
(@category_veg, '胡萝卜', '🥕', 41, 0.9, 9.6, 0.2, 2.8, 4),
(@category_veg, '白菜', '🥬', 17, 1.5, 3.2, 0.1, 1.0, 5),
(@category_veg, '菠菜', '🥬', 23, 2.9, 3.6, 0.4, 2.2, 6),
(@category_veg, '生菜', '🥬', 15, 1.4, 2.9, 0.2, 1.3, 7),
(@category_veg, '茄子', '🍆', 25, 1.1, 5.4, 0.2, 1.3, 8),
(@category_veg, '青椒', '🫑', 22, 1.0, 5.4, 0.2, 1.4, 9),
(@category_veg, '土豆', '🥔', 77, 2.0, 17.2, 0.2, 2.2, 10)
ON DUPLICATE KEY UPDATE `name` = VALUES(`name`);

-- 肉类
SET @category_meat = (SELECT id FROM food_categories WHERE name = '肉类' LIMIT 1);
INSERT INTO `foods` (`category_id`, `name`, `icon`, `calories_per_100g`, `protein_per_100g`, `carbs_per_100g`, `fat_per_100g`, `fiber_per_100g`, `sort_order`) VALUES
(@category_meat, '鸡胸肉', '🍗', 165, 31.0, 0, 3.6, 0, 1),
(@category_meat, '鸡腿', '🍗', 181, 20.0, 0, 9.0, 0, 2),
(@category_meat, '牛肉', '🥩', 250, 26.0, 0, 15.0, 0, 3),
(@category_meat, '猪肉', '🥩', 242, 20.3, 0, 16.9, 0, 4),
(@category_meat, '鱼肉', '🐟', 108, 20.0, 0, 2.2, 0, 5),
(@category_meat, '虾', '🦐', 93, 18.6, 0, 0.8, 0, 6),
(@category_meat, '鸡蛋', '🥚', 144, 13.3, 1.5, 8.8, 0, 7)
ON DUPLICATE KEY UPDATE `name` = VALUES(`name`);

-- 水果类
SET @category_fruit = (SELECT id FROM food_categories WHERE name = '水果' LIMIT 1);
INSERT INTO `foods` (`category_id`, `name`, `icon`, `calories_per_100g`, `protein_per_100g`, `carbs_per_100g`, `fat_per_100g`, `fiber_per_100g`, `sort_order`) VALUES
(@category_fruit, '苹果', '🍎', 52, 0.3, 13.8, 0.2, 2.4, 1),
(@category_fruit, '香蕉', '🍌', 89, 1.1, 22.8, 0.3, 2.6, 2),
(@category_fruit, '橙子', '🍊', 47, 0.9, 11.8, 0.1, 2.4, 3),
(@category_fruit, '葡萄', '🍇', 43, 0.7, 10.3, 0.2, 0.9, 4),
(@category_fruit, '西瓜', '🍉', 30, 0.6, 7.6, 0.1, 0.3, 5),
(@category_fruit, '草莓', '🍓', 32, 0.7, 7.7, 0.3, 2.0, 6),
(@category_fruit, '梨', '🍐', 57, 0.4, 15.2, 0.1, 3.1, 7),
(@category_fruit, '桃子', '🍑', 39, 0.9, 9.5, 0.1, 1.5, 8)
ON DUPLICATE KEY UPDATE `name` = VALUES(`name`);

-- 饮品类
SET @category_drink = (SELECT id FROM food_categories WHERE name = '饮品' LIMIT 1);
INSERT INTO `foods` (`category_id`, `name`, `icon`, `calories_per_100g`, `protein_per_100g`, `carbs_per_100g`, `fat_per_100g`, `fiber_per_100g`, `sort_order`) VALUES
(@category_drink, '牛奶', '🥛', 54, 3.0, 3.4, 3.2, 0, 1),
(@category_drink, '豆浆', '🥤', 31, 1.8, 1.1, 1.6, 0.1, 2),
(@category_drink, '酸奶', '🥛', 99, 3.0, 15.0, 3.3, 0, 3),
(@category_drink, '咖啡', '☕', 1, 0.1, 0, 0, 0, 4),
(@category_drink, '茶', '🍵', 1, 0, 0, 0, 0, 5)
ON DUPLICATE KEY UPDATE `name` = VALUES(`name`);

-- 零食类
SET @category_snack = (SELECT id FROM food_categories WHERE name = '零食' LIMIT 1);
INSERT INTO `foods` (`category_id`, `name`, `icon`, `calories_per_100g`, `protein_per_100g`, `carbs_per_100g`, `fat_per_100g`, `fiber_per_100g`, `sort_order`) VALUES
(@category_snack, '薯片', '🍟', 536, 6.7, 53.0, 35.0, 4.0, 1),
(@category_snack, '巧克力', '🍫', 546, 4.3, 57.0, 31.0, 3.4, 2),
(@category_snack, '饼干', '🍪', 433, 9.0, 67.0, 12.0, 2.0, 3),
(@category_snack, '坚果', '🥜', 607, 20.0, 21.0, 54.0, 8.0, 4),
(@category_snack, '瓜子', '🌻', 606, 19.1, 13.4, 53.4, 4.5, 5),
(@category_snack, '花生', '🥜', 567, 24.8, 16.2, 49.2, 8.5, 6),
(@category_snack, '糖果', '🍬', 394, 0, 98.0, 0, 0, 7),
(@category_snack, '果冻', '🍮', 70, 1.2, 17.0, 0, 0, 8),
(@category_snack, '爆米花', '🍿', 387, 12.9, 77.8, 4.5, 14.5, 9),
(@category_snack, '牛肉干', '🥩', 550, 45.0, 3.0, 40.0, 0, 10)
ON DUPLICATE KEY UPDATE `name` = VALUES(`name`);

-- 3. 插入单位数据
-- 米饭的单位
SET @food_rice = (SELECT id FROM foods WHERE name = '米饭' LIMIT 1);
INSERT INTO `food_units` (`food_id`, `unit_name`, `weight_grams`, `sort_order`) VALUES
(@food_rice, '圆饭盒', 200, 1),
(@food_rice, '方饭盒', 150, 2),
(@food_rice, '小碗', 100, 3),
(@food_rice, '大碗', 250, 4)
ON DUPLICATE KEY UPDATE `unit_name` = VALUES(`unit_name`);

-- 面条的单位
SET @food_noodles = (SELECT id FROM foods WHERE name = '面条' LIMIT 1);
INSERT INTO `food_units` (`food_id`, `unit_name`, `weight_grams`, `sort_order`) VALUES
(@food_noodles, '小碗', 100, 1),
(@food_noodles, '中碗', 150, 2),
(@food_noodles, '大碗', 200, 3)
ON DUPLICATE KEY UPDATE `unit_name` = VALUES(`unit_name`);

-- 馒头的单位
SET @food_bun = (SELECT id FROM foods WHERE name = '馒头' LIMIT 1);
INSERT INTO `food_units` (`food_id`, `unit_name`, `weight_grams`, `sort_order`) VALUES
(@food_bun, '小个', 50, 1),
(@food_bun, '中个', 100, 2),
(@food_bun, '大个', 150, 3)
ON DUPLICATE KEY UPDATE `unit_name` = VALUES(`unit_name`);

-- 包子的单位
SET @food_baozi = (SELECT id FROM foods WHERE name = '包子' LIMIT 1);
INSERT INTO `food_units` (`food_id`, `unit_name`, `weight_grams`, `sort_order`) VALUES
(@food_baozi, '小个', 50, 1),
(@food_baozi, '中个', 80, 2),
(@food_baozi, '大个', 120, 3)
ON DUPLICATE KEY UPDATE `unit_name` = VALUES(`unit_name`);

-- 饺子的单位
SET @food_dumpling = (SELECT id FROM foods WHERE name = '饺子' LIMIT 1);
INSERT INTO `food_units` (`food_id`, `unit_name`, `weight_grams`, `sort_order`) VALUES
(@food_dumpling, '5个', 100, 1),
(@food_dumpling, '8个', 160, 2),
(@food_dumpling, '10个', 200, 3)
ON DUPLICATE KEY UPDATE `unit_name` = VALUES(`unit_name`);

-- 鸡胸肉的单位
SET @food_chicken = (SELECT id FROM foods WHERE name = '鸡胸肉' LIMIT 1);
INSERT INTO `food_units` (`food_id`, `unit_name`, `weight_grams`, `sort_order`) VALUES
(@food_chicken, '小份', 100, 1),
(@food_chicken, '中份', 150, 2),
(@food_chicken, '大份', 200, 3)
ON DUPLICATE KEY UPDATE `unit_name` = VALUES(`unit_name`);

-- 牛肉的单位
SET @food_beef = (SELECT id FROM foods WHERE name = '牛肉' LIMIT 1);
INSERT INTO `food_units` (`food_id`, `unit_name`, `weight_grams`, `sort_order`) VALUES
(@food_beef, '小份', 100, 1),
(@food_beef, '中份', 150, 2),
(@food_beef, '大份', 200, 3)
ON DUPLICATE KEY UPDATE `unit_name` = VALUES(`unit_name`);

-- 鸡蛋的单位
SET @food_egg = (SELECT id FROM foods WHERE name = '鸡蛋' LIMIT 1);
INSERT INTO `food_units` (`food_id`, `unit_name`, `weight_grams`, `sort_order`) VALUES
(@food_egg, '1个', 50, 1),
(@food_egg, '2个', 100, 2),
(@food_egg, '3个', 150, 3)
ON DUPLICATE KEY UPDATE `unit_name` = VALUES(`unit_name`);

-- 香蕉的单位
SET @food_banana = (SELECT id FROM foods WHERE name = '香蕉' LIMIT 1);
INSERT INTO `food_units` (`food_id`, `unit_name`, `weight_grams`, `sort_order`) VALUES
(@food_banana, '小', 100, 1),
(@food_banana, '中', 120, 2),
(@food_banana, '大', 150, 3)
ON DUPLICATE KEY UPDATE `unit_name` = VALUES(`unit_name`);

-- 苹果的单位
SET @food_apple = (SELECT id FROM foods WHERE name = '苹果' LIMIT 1);
INSERT INTO `food_units` (`food_id`, `unit_name`, `weight_grams`, `sort_order`) VALUES
(@food_apple, '小', 100, 1),
(@food_apple, '中', 150, 2),
(@food_apple, '大', 200, 3)
ON DUPLICATE KEY UPDATE `unit_name` = VALUES(`unit_name`);

-- 牛奶的单位
SET @food_milk = (SELECT id FROM foods WHERE name = '牛奶' LIMIT 1);
INSERT INTO `food_units` (`food_id`, `unit_name`, `weight_grams`, `sort_order`) VALUES
(@food_milk, '小杯', 200, 1),
(@food_milk, '中杯', 250, 2),
(@food_milk, '大杯', 300, 3)
ON DUPLICATE KEY UPDATE `unit_name` = VALUES(`unit_name`);

-- 零食的单位
-- 薯片的单位
SET @food_chips = (SELECT id FROM foods WHERE name = '薯片' LIMIT 1);
INSERT INTO `food_units` (`food_id`, `unit_name`, `weight_grams`, `sort_order`) VALUES
(@food_chips, '小包', 30, 1),
(@food_chips, '中包', 50, 2),
(@food_chips, '大包', 100, 3)
ON DUPLICATE KEY UPDATE `unit_name` = VALUES(`unit_name`);

-- 巧克力的单位
SET @food_chocolate = (SELECT id FROM foods WHERE name = '巧克力' LIMIT 1);
INSERT INTO `food_units` (`food_id`, `unit_name`, `weight_grams`, `sort_order`) VALUES
(@food_chocolate, '小块', 10, 1),
(@food_chocolate, '中块', 25, 2),
(@food_chocolate, '大块', 50, 3)
ON DUPLICATE KEY UPDATE `unit_name` = VALUES(`unit_name`);

-- 饼干的单位
SET @food_cookie = (SELECT id FROM foods WHERE name = '饼干' LIMIT 1);
INSERT INTO `food_units` (`food_id`, `unit_name`, `weight_grams`, `sort_order`) VALUES
(@food_cookie, '1片', 5, 1),
(@food_cookie, '3片', 15, 2),
(@food_cookie, '5片', 25, 3)
ON DUPLICATE KEY UPDATE `unit_name` = VALUES(`unit_name`);

-- 坚果的单位
SET @food_nuts = (SELECT id FROM foods WHERE name = '坚果' LIMIT 1);
INSERT INTO `food_units` (`food_id`, `unit_name`, `weight_grams`, `sort_order`) VALUES
(@food_nuts, '小把', 20, 1),
(@food_nuts, '中把', 30, 2),
(@food_nuts, '大把', 50, 3)
ON DUPLICATE KEY UPDATE `unit_name` = VALUES(`unit_name`);

-- 瓜子的单位
SET @food_sunflower = (SELECT id FROM foods WHERE name = '瓜子' LIMIT 1);
INSERT INTO `food_units` (`food_id`, `unit_name`, `weight_grams`, `sort_order`) VALUES
(@food_sunflower, '小把', 20, 1),
(@food_sunflower, '中把', 30, 2),
(@food_sunflower, '大把', 50, 3)
ON DUPLICATE KEY UPDATE `unit_name` = VALUES(`unit_name`);

-- 花生的单位
SET @food_peanut = (SELECT id FROM foods WHERE name = '花生' LIMIT 1);
INSERT INTO `food_units` (`food_id`, `unit_name`, `weight_grams`, `sort_order`) VALUES
(@food_peanut, '小把', 20, 1),
(@food_peanut, '中把', 30, 2),
(@food_peanut, '大把', 50, 3)
ON DUPLICATE KEY UPDATE `unit_name` = VALUES(`unit_name`);

-- 糖果的单位
SET @food_candy = (SELECT id FROM foods WHERE name = '糖果' LIMIT 1);
INSERT INTO `food_units` (`food_id`, `unit_name`, `weight_grams`, `sort_order`) VALUES
(@food_candy, '1颗', 5, 1),
(@food_candy, '3颗', 15, 2),
(@food_candy, '5颗', 25, 3)
ON DUPLICATE KEY UPDATE `unit_name` = VALUES(`unit_name`);

-- 果冻的单位
SET @food_jelly = (SELECT id FROM foods WHERE name = '果冻' LIMIT 1);
INSERT INTO `food_units` (`food_id`, `unit_name`, `weight_grams`, `sort_order`) VALUES
(@food_jelly, '小杯', 100, 1),
(@food_jelly, '中杯', 150, 2),
(@food_jelly, '大杯', 200, 3)
ON DUPLICATE KEY UPDATE `unit_name` = VALUES(`unit_name`);

-- 爆米花的单位
SET @food_popcorn = (SELECT id FROM foods WHERE name = '爆米花' LIMIT 1);
INSERT INTO `food_units` (`food_id`, `unit_name`, `weight_grams`, `sort_order`) VALUES
(@food_popcorn, '小桶', 50, 1),
(@food_popcorn, '中桶', 100, 2),
(@food_popcorn, '大桶', 150, 3)
ON DUPLICATE KEY UPDATE `unit_name` = VALUES(`unit_name`);

-- 牛肉干的单位
SET @food_beef_jerky = (SELECT id FROM foods WHERE name = '牛肉干' LIMIT 1);
INSERT INTO `food_units` (`food_id`, `unit_name`, `weight_grams`, `sort_order`) VALUES
(@food_beef_jerky, '小包', 25, 1),
(@food_beef_jerky, '中包', 50, 2),
(@food_beef_jerky, '大包', 100, 3)
ON DUPLICATE KEY UPDATE `unit_name` = VALUES(`unit_name`);

