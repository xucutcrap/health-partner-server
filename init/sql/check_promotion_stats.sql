-- 渠道推广业绩统计查询脚本
-- 使用方法: 复制SQL到数据库管理工具执行，注意修改时间范围

-- 1. 基础版：按注册人数结算 (当前采用此方案)
-- 统计每个推广员带来的新用户注册数量
-- 注意: 已移除"完成问卷漏斗"等额外验证要求,在其他方面做了风控管控
SELECT 
    p.nickname AS promoter_name,         -- 推广员昵称
    p.openid AS promoter_openid,         -- 推广员OpenID (用于核对)
    COUNT(sr.id) AS total_recruits,      -- 拉新总数 (即有效拉新数)
    COUNT(sr.id) * 1.00 AS payout_amount,-- 应付金额 (假设1元/人)
    MIN(sr.created_at) AS first_recruit_time, -- 第一单时间
    MAX(sr.created_at) AS last_recruit_time   -- 最后一单时间
FROM share_referrals sr
JOIN user_shares us ON sr.share_id = us.id
JOIN users p ON us.user_id = p.id
WHERE 
    sr.created_at >= '2026-01-01 00:00:00'  -- 活动开始时间
    AND sr.created_at <= '2026-01-31 23:59:59' -- 活动截止时间
GROUP BY p.id
ORDER BY total_recruits DESC;


-- 2. 进阶风控版 (推荐)：仅统计"有效"用户
-- 定义"有效": 注册后至少记录过一次饮食 (diet_records表中有数据)
-- 这能有效防止直接注册僵尸号刷单
/*
SELECT 
    p.nickname AS promoter_name,
    COUNT(DISTINCT u.id) AS valid_recruits, -- 有效拉新数
    COUNT(DISTINCT u.id) * 1.00 AS payout_amount
FROM share_referrals sr
JOIN user_shares us ON sr.share_id = us.id
JOIN users p ON us.user_id = p.id          -- 推广员
JOIN users u ON sr.referred_user_id = u.id -- 新用户
INNER JOIN diet_records dr ON u.id = dr.user_id -- 必须有饮食记录
WHERE 
    sr.created_at >= '2026-01-01 00:00:00'
GROUP BY p.id
ORDER BY valid_recruits DESC;
*/
