-- 添加food_id字段（允许NULL，因为需要先添加字段再更新数据）
ALTER TABLE daily_foods 
ADD COLUMN food_id INT NULL COMMENT '食物ID，关联foods表' AFTER id;

-- 添加索引以提高查询性能
CREATE INDEX idx_food_id ON daily_foods(food_id);



-- 批量更新daily_foods表的food_id字段
UPDATE daily_foods
INNER JOIN foods ON TRIM(daily_foods.food_name) COLLATE utf8mb4_unicode_ci = TRIM(foods.food_name) COLLATE utf8mb4_unicode_ci
SET daily_foods.food_id = foods.food_id
WHERE daily_foods.food_id IS NULL;