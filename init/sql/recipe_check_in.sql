-- ========================================
-- 食谱打卡功能SQL脚本
-- 1. 创建打卡记录表
-- 2. 创建打卡统计表
-- ========================================

-- 1. 创建打卡记录表
CREATE TABLE IF NOT EXISTS recipe_check_ins (
    id INT AUTO_INCREMENT PRIMARY KEY COMMENT '打卡记录唯一ID',
    user_id INT NOT NULL COMMENT '用户ID',
    recipe_id INT NOT NULL COMMENT '食谱ID',
    daily_meal_id INT NOT NULL COMMENT '日餐单ID（周期索引）',
    day_number INT NOT NULL COMMENT '周期索引（第几天）',
    check_in_date DATE NOT NULL COMMENT '打卡日期（实际打卡的日期）',
    check_in_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '打卡时间',
    notes TEXT COMMENT '用户备注',
    
    -- 索引
    UNIQUE KEY uk_user_recipe_day (user_id, recipe_id, day_number) COMMENT '用户+食谱+周期索引唯一',
    INDEX idx_user_recipe (user_id, recipe_id) COMMENT '用户+食谱索引',
    INDEX idx_check_in_date (check_in_date) COMMENT '打卡日期索引',
    
    -- 外键
    FOREIGN KEY (user_id) REFERENCES user_profiles(user_id) ON DELETE CASCADE,
    FOREIGN KEY (recipe_id) REFERENCES recipes(id) ON DELETE CASCADE,
    FOREIGN KEY (daily_meal_id) REFERENCES recipe_daily_meals(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='食谱打卡记录表 - 周期性打卡，不绑定严格日期';

-- 2. 创建打卡统计表
CREATE TABLE IF NOT EXISTS recipe_check_in_stats (
    id INT AUTO_INCREMENT PRIMARY KEY COMMENT '统计记录唯一ID',
    user_id INT NOT NULL COMMENT '用户ID',
    recipe_id INT NOT NULL COMMENT '食谱ID',
    total_days INT NOT NULL DEFAULT 0 COMMENT '食谱总周期数',
    checked_days INT NOT NULL DEFAULT 0 COMMENT '已打卡周期数',
    last_checked_day INT NOT NULL DEFAULT 0 COMMENT '最后打卡的周期索引',
    last_check_in_date DATE COMMENT '最后打卡日期',
    start_date DATE COMMENT '开始日期（首次打卡日期）',
    completion_date DATE COMMENT '完成日期（打卡全部周期的日期）',
    is_completed TINYINT DEFAULT 0 COMMENT '是否完成（0=未完成，1=已完成）',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    
    -- 索引
    UNIQUE KEY uk_user_recipe (user_id, recipe_id) COMMENT '用户+食谱唯一',
    INDEX idx_user_id (user_id) COMMENT '用户ID索引',
    INDEX idx_is_completed (is_completed) COMMENT '完成状态索引',
    
    -- 外键
    FOREIGN KEY (user_id) REFERENCES user_profiles(user_id) ON DELETE CASCADE,
    FOREIGN KEY (recipe_id) REFERENCES recipes(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='食谱打卡统计表 - 记录周期性打卡进度';
