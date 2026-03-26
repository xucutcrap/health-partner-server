-- 每日打卡记录表（独立于饮食记录，用户一键打卡）
CREATE TABLE IF NOT EXISTS daily_checkins (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  checkin_date DATE NOT NULL,
  created_at DATETIME DEFAULT NOW(),
  UNIQUE KEY uk_user_date (user_id, checkin_date),  -- 每天只能打一次
  INDEX idx_user (user_id)
);
