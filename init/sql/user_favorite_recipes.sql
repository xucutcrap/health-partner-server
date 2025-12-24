-- ========================================
-- 食谱功能增强SQL脚本
-- 1. 给recipes表添加是否展示字段
-- 2. 添加"我的食谱"分类
-- 3. 创建收藏食谱功能
-- ========================================

-- 1. 给recipes表添加是否展示字段，默认都展示
ALTER TABLE recipes 
ADD COLUMN is_visible TINYINT DEFAULT 1 COMMENT '是否展示（0=不展示，1=展示）' 
AFTER recommend_text;

-- 添加索引优化查询性能
ALTER TABLE recipes 
ADD INDEX idx_recipes_is_visible (is_visible) COMMENT '是否展示索引';

-- 2. 在recipe_groups表最前面插入"我的食谱"分类
-- 首先将现有分类的display_order都增加1，为"我的食谱"腾出位置
UPDATE recipe_groups 
SET display_order = display_order + 1;

-- 插入"我的食谱"分类，display_order设为0确保排在最前面
INSERT INTO recipe_groups (group_id, group_name, display_order, is_active) 
VALUES (0, '我的食谱', 0, 1)
ON DUPLICATE KEY UPDATE 
    group_name = '我的食谱',
    display_order = 0,
    is_active = 1;

-- 3. 创建用户收藏食谱表
CREATE TABLE user_favorite_recipes (
    id INT AUTO_INCREMENT PRIMARY KEY COMMENT '收藏记录唯一ID',
    user_id INT NOT NULL COMMENT 'user_profiles.user_id',
    recipe_id INT NOT NULL COMMENT '食谱ID，关联recipes.id',
    favorite_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '收藏时间',
    notes TEXT COMMENT '用户备注（可选）',
    
    -- 约束与索引
    UNIQUE KEY uk_user_favorite_unique (user_id, recipe_id) COMMENT '用户和食谱组合唯一约束，防止重复收藏',
    INDEX idx_user_favorite_user_id (user_id) COMMENT '用户ID索引，便于查询用户的所有收藏',
    INDEX idx_user_favorite_recipe_id (recipe_id) COMMENT '食谱ID索引，便于查询食谱的收藏数',
    INDEX idx_user_favorite_time (favorite_time DESC) COMMENT '收藏时间索引，便于按时间排序',
    
    -- 外键约束（确保数据完整性）
    FOREIGN KEY (user_id) REFERENCES user_profiles(user_id) ON DELETE CASCADE,
    FOREIGN KEY (recipe_id) REFERENCES recipes(id) ON DELETE CASCADE
) COMMENT='用户收藏食谱表，存储用户收藏的食谱信息';

-- 4. 创建视图：用户的收藏食谱（我的食谱）
CREATE OR REPLACE VIEW user_my_recipes AS
SELECT 
    ufr.user_id,
    r.id as recipe_id,
    r.name as recipe_name,
    r.intro,
    r.pic_url,
    r.promotion,
    r.display_count,
    r.footer,
    r.recommend_text,
    r.is_visible,
    ufr.favorite_time,
    ufr.notes as user_notes
FROM user_favorite_recipes ufr
INNER JOIN recipes r ON ufr.recipe_id = r.id
WHERE r.is_visible = 1  -- 只显示可见的食谱
ORDER BY ufr.favorite_time DESC;

