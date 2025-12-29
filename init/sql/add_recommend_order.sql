-- 添加推荐顺序字段
ALTER TABLE recipes
ADD COLUMN recommend_order INT NULL DEFAULT NULL COMMENT '推荐顺序，数字越小越靠前，NULL不推荐';

-- 添加索引
CREATE INDEX idx_recommend_order ON recipes(recommend_order);

-- (可选) 初始化示例数据，将前6个食谱设为推荐
UPDATE recipes SET recommend_order = 1 WHERE id = 1;
UPDATE recipes SET recommend_order = 2 WHERE id = 2;
UPDATE recipes SET recommend_order = 3 WHERE id = 3;
UPDATE recipes SET recommend_order = 4 WHERE id = 4;
UPDATE recipes SET recommend_order = 5 WHERE id = 5;
UPDATE recipes SET recommend_order = 6 WHERE id = 6;
