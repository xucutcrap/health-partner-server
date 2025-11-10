-- 清理重复的食品数据
USE `health_partner`;

-- 1. 删除 food_units 表中关联到重复 foods 的记录（保留ID较小的food）
DELETE fu1 FROM food_units fu1
INNER JOIN foods f1 ON fu1.food_id = f1.id
INNER JOIN foods f2 ON f1.name = f2.name AND f1.category_id = f2.category_id AND f1.id > f2.id;

-- 2. 删除重复的 foods 记录（保留ID较小的）
DELETE f1 FROM foods f1
INNER JOIN foods f2 ON f1.name = f2.name AND f1.category_id = f2.category_id AND f1.id > f2.id;

-- 3. 删除 food_units 表中关联到已删除 foods 的记录（如果有遗漏）
DELETE fu FROM food_units fu
LEFT JOIN foods f ON fu.food_id = f.id
WHERE f.id IS NULL;

-- 4. 删除重复的 food_categories 记录（保留ID较小的）
-- 先更新 foods 表的 category_id，指向保留的分类ID
UPDATE foods f
INNER JOIN food_categories fc_old ON f.category_id = fc_old.id
INNER JOIN food_categories fc_new ON fc_old.name = fc_new.name AND fc_old.id > fc_new.id
SET f.category_id = fc_new.id;

-- 删除重复的 food_categories
DELETE fc1 FROM food_categories fc1
INNER JOIN food_categories fc2 ON fc1.name = fc2.name AND fc1.id > fc2.id;

-- 5. 删除 food_units 表中的重复记录（保留ID较小的）
DELETE fu1 FROM food_units fu1
INNER JOIN food_units fu2 ON fu1.food_id = fu2.food_id AND fu1.unit_name = fu2.unit_name AND fu1.id > fu2.id;

