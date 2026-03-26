-- 打卡承诺表（30天返半价）
CREATE TABLE IF NOT EXISTS checkin_commitments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  order_id INT NOT NULL,
  start_date DATE NOT NULL,
  refund_amount DECIMAL(10,2) NOT NULL DEFAULT 33.30,
  status ENUM('ongoing','completed','failed') DEFAULT 'ongoing',
  refunded_at DATETIME DEFAULT NULL,
  created_at DATETIME DEFAULT NOW(),
  UNIQUE KEY uk_order (order_id),
  INDEX idx_user_status (user_id, status)
);
