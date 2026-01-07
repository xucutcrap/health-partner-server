const { database } = require('../../core')

/**
 * 记录推广访问/点击
 * @param {number} promoterId 推广员ID
 * @param {string} visitPage 访问页面
 * @param {string} visitorOpenId 访问者OpenID（可选）
 * @param {string} ipAddress 访问者IP地址（可选）
 */
async function recordVisit(promoterId, visitPage = 'default', visitorOpenId = null, ipAddress = null) {
    const sql = `
        INSERT INTO share_visits (promoter_id, visit_page, visitor_openid, ip_address)
        VALUES (?, ?, ?, ?)
    `
    // database.query 返回的是 results，不是 [rows, fields]
    const result = await database.query(sql, [promoterId, visitPage, visitorOpenId, ipAddress])
    return result
}

/**
 * 统计推广员的业绩
 * @param {number} promoterId 
 */
async function getPartnerStats(promoterId) {
    // 1. 累计点击量
    const visitSql = `
        SELECT COUNT(*) as visitCount 
        FROM share_visits 
        WHERE promoter_id = ?
    `
    const visitRows = await database.query(visitSql, [promoterId])
    const visitCount = visitRows[0].visitCount || 0

    // 2. 有效拉新用户 (通过推荐注册的用户，必须完成问卷)
    // 验证一首一尾：q_step_gender (开始) + q_complete (完成)
    const validUserSql = `
        SELECT COUNT(DISTINCT u.id) as validCount
        FROM share_referrals sr
        JOIN user_shares us ON sr.share_id = us.id
        JOIN users u ON sr.referred_user_id = u.id
        WHERE us.user_id = ?
          AND EXISTS (
              SELECT 1 FROM user_behaviors ub 
              WHERE ub.user_id = u.id AND ub.action_type = 'q_step_gender'
          )
          AND EXISTS (
              SELECT 1 FROM user_behaviors ub 
              WHERE ub.user_id = u.id AND ub.action_type = 'q_complete'
          )
    `
    const userRows = await database.query(validUserSql, [promoterId])
    const validUserCount = userRows[0].validCount || 0

    // 3. 计算累计收益
    // A. 拉新收益 (每个有效用户 1 元)
    const referralEarnings = validUserCount * 1.0
    
    // B. 销售提成统计 (会员购买)
    const memberSql = `
        SELECT 
            COALESCE(COUNT(*), 0) as memberCount,
            COALESCE(SUM(amount), 0) as commissionTotal
        FROM partner_earnings
        WHERE promoter_id = ? AND type = 'commission_sale'
    `
    const memberRows = await database.query(memberSql, [promoterId])
    const memberPurchaseCount = parseInt(memberRows[0].memberCount) || 0
    const commissionEarnings = parseFloat(memberRows[0].commissionTotal) || 0
    
    const totalEarnings = referralEarnings + commissionEarnings

    // 4. 查询已提现金额
    const withdrawalSql = `
        SELECT COALESCE(SUM(amount), 0) as withdrawnAmount
        FROM partner_withdrawals
        WHERE user_id = ? AND status = 'completed'
    `
    const withdrawalRows = await database.query(withdrawalSql, [promoterId])
    const withdrawnAmount = parseFloat(withdrawalRows[0].withdrawnAmount) || 0

    // 5. 计算可提现金额
    const availableAmount = totalEarnings - withdrawnAmount

    return {
        visitCount,           // 累计点击量
        validUserCount,       // 有效拉新人数
        memberPurchaseCount,  // 会员购买人数
        commissionEarnings: commissionEarnings.toFixed(2), // (可选) 单独展示佣金
        totalEarnings: totalEarnings.toFixed(2),      // 累计收益
        withdrawnAmount: withdrawnAmount.toFixed(2),  // 已提现
        availableAmount: availableAmount.toFixed(2)   // 可提现
    }
}

module.exports = {
    recordVisit,
    getPartnerStats
}
