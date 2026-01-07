-- 创建提现记录表
CREATE TABLE IF NOT EXISTS partner_withdrawals (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL COMMENT '用户ID',
  amount DECIMAL(10,2) NOT NULL COMMENT '提现金额',
  status ENUM('pending', 'completed', 'rejected') DEFAULT 'pending' COMMENT '状态：待处理/已完成/已拒绝',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '申请时间',
  completed_at DATETIME COMMENT '完成时间',
  remark VARCHAR(255) COMMENT '备注',
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_id (user_id),
  INDEX idx_status (status),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='合伙人提现记录表';
