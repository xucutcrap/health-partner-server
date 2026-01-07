-- Add register_ip to users table
ALTER TABLE users ADD COLUMN register_ip VARCHAR(45) COMMENT '注册IP地址';

-- Create user_behaviors table for funnel validation
CREATE TABLE IF NOT EXISTS user_behaviors (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL COMMENT '用户ID',
    action_type VARCHAR(50) NOT NULL COMMENT '行为类型: q_step_1, q_complete, etc.',
    ip_address VARCHAR(45) COMMENT '操作IP地址',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_user_action (user_id, action_type),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户关键行为日志';

-- Create partner_earnings table for sales commissions (CPS)
CREATE TABLE IF NOT EXISTS partner_earnings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    promoter_id INT NOT NULL COMMENT '推广员用户ID',
    amount DECIMAL(10, 2) NOT NULL COMMENT '收益金额',
    type VARCHAR(20) NOT NULL DEFAULT 'commission_sale' COMMENT '收益类型: commission_sale, etc.',
    source_user_id INT COMMENT '来源用户ID',
    order_id INT COMMENT '关联订单ID',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_promoter (promoter_id),
    FOREIGN KEY (promoter_id) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='合伙人额外收益明细';
