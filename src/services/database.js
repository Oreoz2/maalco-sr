// Database service for read-only queries
import mysql from 'mysql2/promise';

class DatabaseService {
  constructor() {
    this.pool = null;
    this.initializePool();
  }

  initializePool() {
    const config = {
      host: process.env.DB_HOST || '127.0.0.1',
      port: parseInt(process.env.DB_PORT) || 3306,
      user: process.env.DB_USER || 'Maalco',
      password: process.env.DB_PASSWORD || 'xgQCkoUmBexaitGm',
      database: process.env.DB_NAME || 'Maalco_prod',
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      acquireTimeout: 60000,
      timeout: 60000,
      family: 4, // Force IPv4
    };

    this.pool = mysql.createPool(config);
  }

  // Parse date range into SQL conditions (timezone-aware)
  getDateRange(dateRange = '7d') {
    const now = new Date();
    let startDate, endDate;

    switch (dateRange) {
      case 'today':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        endDate.setHours(23, 59, 59, 999);
        break;
      case 'yesterday':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
        endDate.setHours(23, 59, 59, 999);
        break;
      case '7d':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6);
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        endDate.setHours(23, 59, 59, 999);
        break;
      case '30d':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 29);
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        endDate.setHours(23, 59, 59, 999);
        break;
      case '3m':
        startDate = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate());
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        endDate.setHours(23, 59, 59, 999);
        break;
      case '6m':
        startDate = new Date(now.getFullYear(), now.getMonth() - 6, now.getDate());
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        endDate.setHours(23, 59, 59, 999);
        break;
      case '1y':
        startDate = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        endDate.setHours(23, 59, 59, 999);
        break;
      default:
        if (dateRange.startsWith('custom:')) {
          const [, start, end] = dateRange.split(':');
          startDate = new Date(start);
          startDate.setHours(0, 0, 0, 0);
          endDate = new Date(end);
          endDate.setHours(23, 59, 59, 999);
        } else {
          // Default to 7 days
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6);
          startDate.setHours(0, 0, 0, 0);
          endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          endDate.setHours(23, 59, 59, 999);
        }
    }

    return { startDate, endDate };
  }

  // Get timezone-aware date condition for SQL queries
  getDateCondition(dateRange, dateColumn = 'created_at') {
    if (dateRange === 'all') {
      return { condition: '', params: [] };
    }

    const now = new Date();
    let condition, params;

    switch (dateRange) {
      case 'today':
        condition = `AND DATE(${dateColumn}) = CURDATE()`;
        params = [];
        break;
      case 'yesterday':
        condition = `AND DATE(${dateColumn}) = DATE_SUB(CURDATE(), INTERVAL 1 DAY)`;
        params = [];
        break;
      case '7d':
        condition = `AND DATE(${dateColumn}) >= DATE_SUB(CURDATE(), INTERVAL 6 DAY)`;
        params = [];
        break;
      case '30d':
        condition = `AND DATE(${dateColumn}) >= DATE_SUB(CURDATE(), INTERVAL 29 DAY)`;
        params = [];
        break;
      case '3m':
        condition = `AND DATE(${dateColumn}) >= DATE_SUB(CURDATE(), INTERVAL 3 MONTH)`;
        params = [];
        break;
      case '6m':
        condition = `AND DATE(${dateColumn}) >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH)`;
        params = [];
        break;
      case '1y':
        condition = `AND DATE(${dateColumn}) >= DATE_SUB(CURDATE(), INTERVAL 1 YEAR)`;
        params = [];
        break;
      default:
        if (dateRange.startsWith('custom:')) {
          const [, start, end] = dateRange.split(':');
          condition = `AND DATE(${dateColumn}) BETWEEN ? AND ?`;
          params = [start, end];
        } else {
          // Default to 7 days
          condition = `AND DATE(${dateColumn}) >= DATE_SUB(CURDATE(), INTERVAL 6 DAY)`;
          params = [];
        }
    }

    return { condition, params };
  }

  // Get all active SRs with their performance data
  async getSRs(dateRange = 'all') {
    
    let dateCondition = '';
    let params = [];
    
    if (dateRange !== 'all') {
      const { startDate, endDate } = this.getDateRange(dateRange);
      dateCondition = 'AND u.created_at BETWEEN ? AND ?';
      params = [startDate, endDate];
    }

    const query = `
      SELECT 
        mp.id,
        mp.name,
        mp.referral_code,
        mp.mobile as phone,
        mp.email,
        mp.logo as profileImage,
        mp.created_at as joinDate,
        COUNT(DISTINCT u.id) as totalCustomersRegistered,
        COUNT(DISTINCT CASE WHEN o.active_status IN ('2', '3', '4', '5', '6') THEN o.id END) as totalOrders,
        COALESCE(SUM(CASE WHEN o.active_status IN ('2', '3', '4', '5', '6') THEN o.final_total END), 0) as totalOrderValue
      FROM marketing_persons mp
      LEFT JOIN users u ON mp.referral_code = u.referral_code ${dateCondition}
      LEFT JOIN orders o ON u.id = o.user_id AND o.active_status IN ('2', '3', '4', '5', '6')
      WHERE mp.status = 1
        AND mp.name NOT IN ('ggh', 'gmg', 'gh', 'tuii', 'Marketing Person')
        AND mp.name NOT LIKE '%test%'
        AND mp.name NOT LIKE '%@%'
        AND LENGTH(mp.name) > 3
      GROUP BY mp.id, mp.name, mp.referral_code, mp.mobile, mp.email, mp.logo, mp.created_at
      ORDER BY totalCustomersRegistered DESC
    `;

    const [rows] = await this.pool.execute(query, params);
    return rows;
  }

  // Get daily activity data for trends
  async getDailyActivity(dateRange = '7d') {
    const { startDate, endDate } = this.getDateRange(dateRange);

    const query = `
      SELECT 
        u.referral_code as srCode,
        DATE(u.created_at) as date,
        'registrations' as type,
        COUNT(*) as count,
        0 as value
      FROM users u 
      JOIN marketing_persons mp ON u.referral_code = mp.referral_code
      WHERE mp.status = 1
        AND mp.name NOT IN ('ggh', 'gmg', 'gh', 'tuii', 'Marketing Person')
        AND mp.name NOT LIKE '%test%'
        AND mp.name NOT LIKE '%@%'
        AND LENGTH(mp.name) > 3
        AND u.created_at BETWEEN ? AND ?
      GROUP BY u.referral_code, DATE(u.created_at)
      
      UNION ALL
      
      SELECT 
        u.referral_code as srCode,
        DATE(o.created_at) as date,
        'orders' as type,
        COUNT(o.id) as count,
        SUM(o.final_total) as value
      FROM orders o
      JOIN users u ON o.user_id = u.id
      JOIN marketing_persons mp ON u.referral_code = mp.referral_code
      WHERE mp.status = 1
        AND mp.name NOT IN ('ggh', 'gmg', 'gh', 'tuii', 'Marketing Person')
        AND mp.name NOT LIKE '%test%'
        AND mp.name NOT LIKE '%@%'
        AND LENGTH(mp.name) > 3
        AND o.created_at BETWEEN ? AND ?
        AND o.status != '1'
      GROUP BY u.referral_code, DATE(o.created_at)
      ORDER BY date DESC, srCode, type
    `;

    const params = [startDate, endDate, startDate, endDate];
    const [rows] = await this.pool.execute(query, params);
    return rows;
  }

  // Get SR by ID with detailed performance
  async getSRById(id) {
    const query = `
      SELECT 
        mp.id,
        mp.name,
        mp.referral_code,
        mp.mobile as phone,
        mp.email,
        mp.logo as profileImage,
        mp.created_at as joinDate,
        COUNT(DISTINCT u.id) as totalCustomersRegistered,
        COUNT(DISTINCT CASE WHEN o.status != '1' THEN o.id END) as totalOrders,
        COALESCE(SUM(CASE WHEN o.status != '1' THEN o.final_total END), 0) as totalOrderValue
      FROM marketing_persons mp
      LEFT JOIN users u ON mp.referral_code = u.referral_code
      LEFT JOIN orders o ON u.id = o.user_id AND o.status != '1'
      WHERE mp.id = ? AND mp.status = 1
      GROUP BY mp.id, mp.name, mp.referral_code, mp.mobile, mp.email, mp.logo, mp.created_at
    `;

    const [rows] = await this.pool.execute(query, [id]);
    return rows[0];
  }

  // Get dashboard summary stats (successful transactions only)
  async getDashboardSummary(dateRange = '7d') {
    let dateCondition = '';
    let params = [];
    
    if (dateRange !== 'all') {
      const { startDate, endDate } = this.getDateRange(dateRange);
      dateCondition = 'AND u.created_at BETWEEN ? AND ?';
      params = [startDate, endDate];
    }

    const query = `
      SELECT 
        COUNT(DISTINCT u.id) as totalRegistrations,
        COUNT(DISTINCT CASE WHEN t.status = 'success' AND o.active_status IN ('2', '3', '4', '5', '6') THEN o.id END) as totalOrders,
        COALESCE(SUM(CASE WHEN t.status = 'success' AND o.active_status IN ('2', '3', '4', '5', '6') THEN o.final_total END), 0) as totalOrderValue,
        COUNT(DISTINCT mp.id) as totalActiveSRs
      FROM marketing_persons mp
      LEFT JOIN users u ON mp.referral_code = u.referral_code ${dateCondition}
      LEFT JOIN orders o ON u.id = o.user_id AND o.active_status IN ('2', '3', '4', '5', '6')
      LEFT JOIN transactions t ON o.id = CAST(t.order_id AS UNSIGNED) AND t.status = 'success'
      WHERE mp.status = 1
        AND mp.name NOT IN ('ggh', 'gmg', 'gh', 'tuii', 'Marketing Person')
        AND mp.name NOT LIKE '%test%'
        AND mp.name NOT LIKE '%@%'
        AND LENGTH(mp.name) > 3
    `;

    const [rows] = await this.pool.execute(query, params);
    return rows[0];
  }

  // Get export data
  async getExportData(dateRange = '30d', format = 'detailed') {
    const { startDate, endDate } = this.getDateRange(dateRange);

    if (format === 'summary') {
      return this.getSRs(dateRange);
    }

    const query = `
      SELECT 
        mp.name as sr_name,
        mp.referral_code as sr_code,
        u.name as customer_name,
        u.mobile as customer_phone,
        DATE(u.created_at) as registration_date,
        o.id as order_id,
        o.final_total as order_value,
        DATE(o.created_at) as order_date,
        o.status as order_status
      FROM marketing_persons mp
      LEFT JOIN users u ON mp.referral_code = u.referral_code
      LEFT JOIN orders o ON u.id = o.user_id
      WHERE mp.status = 1
        AND mp.name NOT IN ('ggh', 'gmg', 'gh', 'tuii', 'Marketing Person')
        AND mp.name NOT LIKE '%test%'
        AND mp.name NOT LIKE '%@%'
        AND LENGTH(mp.name) > 3 
        AND u.created_at BETWEEN ? AND ?
      ORDER BY mp.name, u.created_at DESC, o.created_at DESC
    `;

    const [rows] = await this.pool.execute(query, [startDate, endDate]);
    return rows;
  }

  // Get ALL platform registration summary
  async getAllRegistrationSummary(dateRange = '30d') {
    let dateCondition = '';
    let params = [];
    
    if (dateRange !== 'all') {
      const { condition, params: dateParams } = this.getDateCondition(dateRange, 'u.created_at');
      dateCondition = condition.replace('AND', 'WHERE');
      params = dateParams;
    }

    const query = `
      SELECT 
          COUNT(DISTINCT u.id) as totalRegistrations,
          COUNT(DISTINCT u.referral_code) as uniqueReferralCodes,
          COUNT(DISTINCT DATE(u.created_at)) as activeDays,
          ROUND(COUNT(DISTINCT u.id) / NULLIF(COUNT(DISTINCT DATE(u.created_at)), 0), 2) as avgRegistrationsPerDay,
          COUNT(DISTINCT CASE 
              WHEN mp.referral_code IS NOT NULL AND mp.status = 1 
                  AND mp.name NOT IN ('ggh', 'gmg', 'gh', 'tuii', 'Marketing Person')
                  AND mp.name NOT LIKE '%test%'
                  AND mp.name NOT LIKE '%@%'
                  AND LENGTH(mp.name) > 3
              THEN u.id END) as validSRLinkedRegistrations,
          COUNT(DISTINCT CASE 
              WHEN mp.referral_code IS NULL OR mp.status != 1 
                  OR mp.name IN ('ggh', 'gmg', 'gh', 'tuii', 'Marketing Person')
                  OR mp.name LIKE '%test%'
                  OR mp.name LIKE '%@%'
                  OR LENGTH(mp.name) <= 3
              THEN u.id END) as directRegistrations
      FROM users u 
      LEFT JOIN marketing_persons mp ON u.referral_code = mp.referral_code
      ${dateCondition}
    `;

    const [rows] = await this.pool.execute(query, params);
    return rows[0];
  }

  // Get ALL platform registration trends
  async getAllRegistrationTrends(dateRange = '30d') {
    const { condition: dateCondition, params } = this.getDateCondition(dateRange, 'u.created_at');

    const query = `
      SELECT 
          DATE(u.created_at) as date,
          COUNT(u.id) as totalRegistrations,
          COUNT(CASE 
              WHEN mp.referral_code IS NOT NULL AND mp.status = 1 
                  AND mp.name NOT IN ('ggh', 'gmg', 'gh', 'tuii', 'Marketing Person')
                  AND mp.name NOT LIKE '%test%'
                  AND mp.name NOT LIKE '%@%'
                  AND LENGTH(mp.name) > 3
              THEN u.id END) as srLinkedRegistrations,
          COUNT(CASE 
              WHEN mp.referral_code IS NULL OR mp.status != 1 
                  OR mp.name IN ('ggh', 'gmg', 'gh', 'tuii', 'Marketing Person')
                  OR mp.name LIKE '%test%'
                  OR mp.name LIKE '%@%'
                  OR LENGTH(mp.name) <= 3
              THEN u.id END) as directRegistrations,
          DAYNAME(u.created_at) as dayName
      FROM users u 
      LEFT JOIN marketing_persons mp ON u.referral_code = mp.referral_code
      WHERE 1=1 ${dateCondition}
      GROUP BY DATE(u.created_at), DAYNAME(u.created_at)
      ORDER BY DATE(u.created_at) DESC
    `;

    const [rows] = await this.pool.execute(query, params);
    return rows;
  }

  // Get registration source breakdown
  async getRegistrationSources(dateRange = '30d') {
    const { condition: dateCondition, params } = this.getDateCondition(dateRange, 'u.created_at');
    const { condition: subqueryCondition, params: subqueryParams } = this.getDateCondition(dateRange, 'u2.created_at');

    const query = `
      SELECT 
          CASE 
              WHEN mp.referral_code IS NOT NULL AND mp.status = 1 
                  AND mp.name NOT IN ('ggh', 'gmg', 'gh', 'tuii', 'Marketing Person')
                  AND mp.name NOT LIKE '%test%'
                  AND mp.name NOT LIKE '%@%'
                  AND LENGTH(mp.name) > 3
              THEN 'Valid SR'
              WHEN mp.referral_code IS NOT NULL
              THEN 'Invalid/Test SR'
              WHEN u.referral_code IS NULL OR u.referral_code = ''
              THEN 'No Referral Code'
              ELSE 'Random/Unknown Code'
          END as source,
          COUNT(u.id) as registrations,
          ROUND((COUNT(u.id) * 100.0 / (
              SELECT COUNT(*) FROM users u2 WHERE 1=1 ${subqueryCondition}
          )), 2) as percentage
      FROM users u 
      LEFT JOIN marketing_persons mp ON u.referral_code = mp.referral_code
      WHERE 1=1 ${dateCondition}
      GROUP BY source
      ORDER BY registrations DESC
    `;

    const [rows] = await this.pool.execute(query, [...params, ...subqueryParams]);
    return rows;
  }

  // Get enhanced sales summary (only successful transactions, matching platform logic)
  async getEnhancedSalesSummary(dateRange = '30d') {
    const { condition: dateCondition, params } = this.getDateCondition(dateRange, 'o.created_at');

    const query = `
      SELECT 
          COUNT(DISTINCT o.id) as totalOrders,
          COALESCE(ROUND(SUM(o.total), 2), 0) as totalOrderValue,
          COALESCE(ROUND(SUM(o.delivery_charge), 2), 0) as totalDeliveryCharges,
          COALESCE(ROUND(SUM(o.total + o.delivery_charge), 2), 0) as totalRevenue,
          COUNT(DISTINCT o.user_id) as uniqueCustomers,
          COUNT(DISTINCT u.referral_code) as uniqueReferralCodes,
          COALESCE(ROUND(AVG(o.final_total), 2), 0) as avgOrderValue,
          COALESCE(ROUND(AVG(o.total), 2), 0) as avgOrderTotal,
          COALESCE(ROUND(AVG(o.delivery_charge), 2), 0) as avgDeliveryCharge,
          COUNT(DISTINCT DATE(o.created_at)) as activeDays,
          COUNT(DISTINCT CASE 
              WHEN mp.referral_code IS NOT NULL AND mp.status = 1 
                  AND mp.name NOT IN ('ggh', 'gmg', 'gh', 'tuii', 'Marketing Person')
                  AND mp.name NOT LIKE '%test%'
                  AND mp.name NOT LIKE '%@%'
                  AND LENGTH(mp.name) > 3
              THEN o.id END) as srLinkedOrders,
          COALESCE(ROUND(SUM(CASE 
              WHEN mp.referral_code IS NOT NULL AND mp.status = 1 
                  AND mp.name NOT IN ('ggh', 'gmg', 'gh', 'tuii', 'Marketing Person')
                  AND mp.name NOT LIKE '%test%'
                  AND mp.name NOT LIKE '%@%'
                  AND LENGTH(mp.name) > 3
              THEN o.total END), 2), 0) as srLinkedOrderTotal,
          COALESCE(ROUND(SUM(CASE 
              WHEN mp.referral_code IS NOT NULL AND mp.status = 1 
                  AND mp.name NOT IN ('ggh', 'gmg', 'gh', 'tuii', 'Marketing Person')
                  AND mp.name NOT LIKE '%test%'
                  AND mp.name NOT LIKE '%@%'
                  AND LENGTH(mp.name) > 3
              THEN o.delivery_charge END), 2), 0) as srLinkedDeliveryCharges,
          COALESCE(ROUND(SUM(CASE 
              WHEN mp.referral_code IS NOT NULL AND mp.status = 1 
                  AND mp.name NOT IN ('ggh', 'gmg', 'gh', 'tuii', 'Marketing Person')
                  AND mp.name NOT LIKE '%test%'
                  AND mp.name NOT LIKE '%@%'
                  AND LENGTH(mp.name) > 3
              THEN (o.total + o.delivery_charge) END), 2), 0) as srLinkedRevenue
      FROM orders o
      JOIN users u ON o.user_id = u.id
      LEFT JOIN marketing_persons mp ON u.referral_code = mp.referral_code
      WHERE o.active_status IN ('2', '3', '4', '5', '6') ${dateCondition}
      GROUP BY NULL
    `;

    const [rows] = await this.pool.execute(query, params);
    return rows[0];
  }

  // Get enhanced sales trends (only successful transactions, matching platform logic)
  async getEnhancedSalesTrends(dateRange = '30d') {
    const { condition: dateCondition, params } = this.getDateCondition(dateRange, 'o.created_at');

    const query = `
      SELECT 
          DATE(o.created_at) as date,
          COUNT(o.id) as totalOrders,
          COALESCE(ROUND(SUM(o.total), 2), 0) as totalOrderValue,
          COALESCE(ROUND(SUM(o.delivery_charge), 2), 0) as totalDeliveryCharges,
          COALESCE(ROUND(SUM(o.total + o.delivery_charge), 2), 0) as totalRevenue,
          COUNT(DISTINCT o.user_id) as uniqueCustomers,
          COALESCE(ROUND(AVG(o.final_total), 2), 0) as avgOrderValue,
          COALESCE(ROUND(AVG(o.total), 2), 0) as avgOrderTotal,
          COALESCE(ROUND(AVG(o.delivery_charge), 2), 0) as avgDeliveryCharge,
          COUNT(CASE 
              WHEN mp.referral_code IS NOT NULL AND mp.status = 1 
                  AND mp.name NOT IN ('ggh', 'gmg', 'gh', 'tuii', 'Marketing Person')
                  AND mp.name NOT LIKE '%test%'
                  AND mp.name NOT LIKE '%@%'
                  AND LENGTH(mp.name) > 3
              THEN o.id END) as srLinkedOrders,
          COALESCE(ROUND(SUM(CASE 
              WHEN mp.referral_code IS NOT NULL AND mp.status = 1 
                  AND mp.name NOT IN ('ggh', 'gmg', 'gh', 'tuii', 'Marketing Person')
                  AND mp.name NOT LIKE '%test%'
                  AND mp.name NOT LIKE '%@%'
                  AND LENGTH(mp.name) > 3
              THEN o.total END), 2), 0) as srLinkedOrderTotal,
          COALESCE(ROUND(SUM(CASE 
              WHEN mp.referral_code IS NOT NULL AND mp.status = 1 
                  AND mp.name NOT IN ('ggh', 'gmg', 'gh', 'tuii', 'Marketing Person')
                  AND mp.name NOT LIKE '%test%'
                  AND mp.name NOT LIKE '%@%'
                  AND LENGTH(mp.name) > 3
              THEN o.delivery_charge END), 2), 0) as srLinkedDeliveryCharges,
          COALESCE(ROUND(SUM(CASE 
              WHEN mp.referral_code IS NOT NULL AND mp.status = 1 
                  AND mp.name NOT IN ('ggh', 'gmg', 'gh', 'tuii', 'Marketing Person')
                  AND mp.name NOT LIKE '%test%'
                  AND mp.name NOT LIKE '%@%'
                  AND LENGTH(mp.name) > 3
              THEN (o.total + o.delivery_charge) END), 2), 0) as srLinkedRevenue,
          DAYNAME(o.created_at) as dayName
      FROM orders o
      JOIN users u ON o.user_id = u.id
      LEFT JOIN marketing_persons mp ON u.referral_code = mp.referral_code
      WHERE o.active_status IN ('2', '3', '4', '5', '6') ${dateCondition}
      GROUP BY DATE(o.created_at), DAYNAME(o.created_at)
      ORDER BY DATE(o.created_at) DESC
    `;

    const [rows] = await this.pool.execute(query, params);
    return rows;
  }

  async close() {
    if (this.pool) {
      await this.pool.end();
    }
  }
}

export default new DatabaseService();