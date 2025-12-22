-- ========================================
-- 多规格食物系统干净部署脚本（避免重复数据）
-- ========================================

-- 使用说明：
-- 1. 此脚本只创建表结构和视图，不插入数据
-- 2. 数据插入请单独使用 insert_food_specs.sql
-- 3. 这样可以避免重复数据问题

-- ========================================
-- 第一步：创建食物规格表
-- ========================================

CREATE TABLE IF NOT EXISTS food_specs (
    spec_id INT AUTO_INCREMENT PRIMARY KEY COMMENT '规格ID',
    food_id INT NOT NULL COMMENT '食物ID',
    spec_name VARCHAR(50) NOT NULL COMMENT '规格名称（如：小、中、大）',
    refer_unit VARCHAR(50) NOT NULL COMMENT '参考单位（如：个(小)、个(中)、个(大)）',
    unit_count DECIMAL(10,2) NOT NULL COMMENT '单位数量（克）',
    unit_weight DECIMAL(10,2) DEFAULT 1.0 COMMENT '单位重量',
    is_default TINYINT(1) DEFAULT 0 COMMENT '是否为默认规格',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    FOREIGN KEY (food_id) REFERENCES foods(food_id) ON DELETE CASCADE,
    INDEX idx_food_id (food_id),
    INDEX idx_spec_name (spec_name),
    INDEX idx_is_default (is_default),
    UNIQUE KEY uk_food_spec (food_id, spec_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='食物规格表';

-- ========================================
-- 第二步：创建视图（不插入数据）
-- ========================================

-- 删除旧视图（如果存在）
DROP VIEW IF EXISTS foods_with_specs;
DROP VIEW IF EXISTS daily_foods_detail;

-- 创建食物规格联合视图
CREATE VIEW foods_with_specs AS
SELECT 
    f.food_id,
    f.food_name,
    f.calory_per_100g,
    f.img_url,
    f.category,
    f.unit,
    f.refer_unit as default_refer_unit,
    f.unit_count as default_unit_count,
    f.unit_weight as default_unit_weight,
    fs.spec_id,
    fs.spec_name,
    fs.refer_unit,
    fs.unit_count,
    fs.unit_weight,
    fs.is_default,
    -- 计算每个规格的卡路里
    ROUND((fs.unit_count / 100.0) * f.calory_per_100g, 2) as calories_per_unit,
    f.created_at,
    f.updated_at
FROM foods f
LEFT JOIN food_specs fs ON f.food_id = fs.food_id
ORDER BY f.food_id, fs.is_default DESC, fs.spec_id;

-- 创建每日食物详情视图（支持多规格）
CREATE VIEW daily_foods_detail AS
SELECT
    df.id,
    df.daily_meal_id,
    df.meal_type,
    df.meal_name,
    df.meal_calories,
    df.food_name,
    df.food_count,
    df.unit,
    df.display_order,
    df.food_id,
    f.food_name AS food_name_full,
    f.calory_per_100g,
    f.img_url AS food_img_url,
    f.category,
    -- 优先使用规格表中的数据，如果没有则使用foods表中的默认数据
    COALESCE(fs.refer_unit, f.refer_unit) as refer_unit,
    COALESCE(fs.unit_count, f.unit_count) as unit_count,
    COALESCE(fs.unit_weight, f.unit_weight) as unit_weight,
    fs.spec_name,
    fs.is_default,
    -- 计算单个食物的卡路里
    CASE
        -- 情况1: 用户使用基础单位（克或毫升）
        WHEN df.unit COLLATE utf8mb4_unicode_ci = '克' COLLATE utf8mb4_unicode_ci 
             OR df.unit COLLATE utf8mb4_unicode_ci = '毫升' COLLATE utf8mb4_unicode_ci THEN
            ROUND((df.food_count / 100.0) * f.calory_per_100g, 2)
        -- 情况2: 用户使用参考单位，优先使用规格表数据
        WHEN COALESCE(fs.unit_count, f.unit_count) IS NOT NULL THEN
            ROUND((df.food_count * COALESCE(fs.unit_count, f.unit_count) / 100.0) * f.calory_per_100g, 2)
        -- 情况3: 无法匹配单位，返回NULL
        ELSE NULL
    END AS food_calories
FROM daily_foods df
LEFT JOIN foods f ON df.food_id = f.food_id
LEFT JOIN food_specs fs ON f.food_id = fs.food_id 
    AND df.unit COLLATE utf8mb4_unicode_ci = fs.refer_unit COLLATE utf8mb4_unicode_ci;

-- ========================================
-- 第三步：验证表结构创建
-- ========================================

SELECT 
    '表结构创建完成' as status,
    'food_specs表已创建，请使用insert_food_specs.sql导入数据' as next_step;

-- ========================================
-- 部署说明
-- ========================================

/*
正确的部署步骤：

1. 执行此脚本创建表结构：
   mysql -u your_user -p your_database < deploy_multi_specs_clean.sql

2. 导入规格数据：
   mysql -u your_user -p your_database < insert_food_specs.sql

3. 如果出现重复数据，运行清理脚本：
   mysql -u your_user -p your_database < clean_duplicates.sql

4. 验证部署结果：
   mysql -u your_user -p your_database < verify_deployment.sql

注意：
- 此脚本不会从foods表迁移数据，避免重复
- insert_food_specs.sql包含了完整的规格数据
- 如果需要清理重复数据，使用clean_duplicates.sql
*/