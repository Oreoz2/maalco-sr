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
      port: parseInt(process.env.DB_PORT) || 3307,
      user: process.env.DB_USER || 'Maalco',
      password: process.env.DB_PASSWORD || 'xgQCkoUmBexaitGm',
      database: process.env.DB_NAME || 'Maalco_prod',
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
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

  // ==========================================
  // DRIVERS DASHBOARD QUERIES
  // ==========================================

  // Get all active drivers from orders table - REWRITTEN Phase 7.1
  async getDrivers(dateRange = '30d') {
    const { condition: dateCondition, params } = this.getDateCondition(dateRange, 'o.created_at');

    const query = `
      SELECT
        db.id,
        db.name,
        db.mobile,
        db.admin_id,
        db.created_at as joinDate,
        db.status,
        db.is_available,

        -- Order Assignment Metrics (from orders table)
        COUNT(DISTINCT o.id) as totalOrdersAssigned,
        COUNT(DISTINCT CASE WHEN o.active_status = '6' THEN o.id END) as deliveredCount,
        COUNT(DISTINCT CASE WHEN o.active_status = '5' THEN o.id END) as outForDeliveryCount,
        COUNT(DISTINCT CASE WHEN o.active_status = '7' THEN o.id END) as cancelledCount,
        COUNT(DISTINCT CASE WHEN o.active_status = '8' THEN o.id END) as returnedCount,

        -- Delivery Time from order_statuses (status 5 -> 6)
        COALESCE(ROUND(AVG(
          CASE
            WHEN os_delivered.status = '6' AND os_out.created_at IS NOT NULL
            THEN TIMESTAMPDIFF(MINUTE, os_out.created_at, os_delivered.created_at)
          END
        ), 2), 0) as avgDeliveryTimeMinutes,

        COALESCE(ROUND(AVG(
          CASE
            WHEN os_delivered.status = '6' AND os_out.created_at IS NOT NULL
            THEN TIMESTAMPDIFF(MINUTE, os_out.created_at, os_delivered.created_at) / 60
          END
        ), 2), 0) as avgDeliveryTimeHours,

        MIN(
          CASE
            WHEN os_delivered.status = '6' AND os_out.created_at IS NOT NULL
            THEN TIMESTAMPDIFF(MINUTE, os_out.created_at, os_delivered.created_at)
          END
        ) as minDeliveryTimeMinutes,

        MAX(
          CASE
            WHEN os_delivered.status = '6' AND os_out.created_at IS NOT NULL
            THEN TIMESTAMPDIFF(MINUTE, os_out.created_at, os_delivered.created_at)
          END
        ) as maxDeliveryTimeMinutes,

        -- Productivity Metrics
        COUNT(DISTINCT DATE(o.created_at)) as activeDays,
        ROUND(COUNT(DISTINCT o.id) / NULLIF(COUNT(DISTINCT DATE(o.created_at)), 0), 2) as avgOrdersPerDay,

        -- Success Rate (delivered / total assigned)
        ROUND((COUNT(DISTINCT CASE WHEN o.active_status = '6' THEN o.id END) * 100.0 /
          NULLIF(COUNT(DISTINCT o.id), 0)), 1) as deliverySuccessRate

      FROM orders o
      INNER JOIN delivery_boys db ON o.delivery_boy_id = db.id
      LEFT JOIN order_statuses os_out ON o.id = os_out.order_id
        AND os_out.status = '5'
      LEFT JOIN order_statuses os_delivered ON o.id = os_delivered.order_id
        AND os_delivered.status = '6'
      WHERE o.delivery_boy_id IS NOT NULL
        AND o.delivery_boy_id != 0
        ${dateCondition}
      GROUP BY db.id, db.name, db.mobile, db.admin_id, db.created_at, db.status, db.is_available
      ORDER BY deliveredCount DESC, totalOrdersAssigned DESC
    `;

    const [rows] = await this.pool.execute(query, params);
    return rows;
  }

  // Get driver daily activity from order_statuses - REWRITTEN Phase 7
  async getDriverDailyActivity(dateRange = '30d') {
    // Use a union approach to capture activity from both order creation and delivery dates
    const { condition: dateCondition1, params: params1 } = this.getDateCondition(dateRange, 'activity_date');

    const query = `
      SELECT
        driverId,
        driverName,
        activity_date as date,
        SUM(totalOrders) as totalOrders,
        SUM(outForDelivery) as outForDelivery,
        SUM(delivered) as delivered,
        ROUND(AVG(avgDeliveryTimeMinutes), 2) as avgDeliveryTimeMinutes,
        ROUND((SUM(delivered) * 100.0 / NULLIF(SUM(totalOrders), 0)), 1) as successRate,
        DAYNAME(activity_date) as dayName
      FROM (
        -- Get all assigned orders by date
        SELECT
          db.id as driverId,
          db.name as driverName,
          DATE(COALESCE(os_delivered.created_at, os_out.created_at, o.created_at)) as activity_date,
          COUNT(DISTINCT o.id) as totalOrders,
          COUNT(DISTINCT CASE WHEN os_out.order_id IS NOT NULL THEN o.id END) as outForDelivery,
          COUNT(DISTINCT CASE WHEN os_delivered.order_id IS NOT NULL THEN o.id END) as delivered,
          AVG(
            CASE
              WHEN os_delivered.created_at IS NOT NULL AND os_out.created_at IS NOT NULL
              THEN TIMESTAMPDIFF(MINUTE, os_out.created_at, os_delivered.created_at)
            END
          ) as avgDeliveryTimeMinutes
        FROM orders o
        INNER JOIN delivery_boys db ON o.delivery_boy_id = db.id
        LEFT JOIN order_statuses os_out ON o.id = os_out.order_id AND os_out.status = '5'
        LEFT JOIN order_statuses os_delivered ON o.id = os_delivered.order_id AND os_delivered.status = '6'
        WHERE o.delivery_boy_id IS NOT NULL
          AND o.delivery_boy_id != 0
        GROUP BY db.id, db.name, DATE(COALESCE(os_delivered.created_at, os_out.created_at, o.created_at))
      ) as driver_activity
      WHERE 1=1 ${dateCondition1}
      GROUP BY driverId, driverName, activity_date, DAYNAME(activity_date)
      ORDER BY activity_date DESC, driverId ASC
    `;

    const [rows] = await this.pool.execute(query, params1);
    return rows;
  }

  // ==========================================
  // CSR DASHBOARD QUERIES
  // ==========================================

  // Get all CSR staff (role_id = 7 or 8 from admins table)
  async getCSRStaff(dateRange = '30d') {
    const { condition: dateCondition, params } = this.getDateCondition(dateRange, 'ci.created_at');

    const query = `
      SELECT
        a.id,
        a.username as name,
        a.email,
        a.created_at as joinDate,
        a.status,
        COUNT(DISTINCT ci.id) as totalInteractions,
        COUNT(DISTINCT CASE WHEN ci.interaction_type = 'new_order' THEN ci.id END) as newOrderCalls,
        COUNT(DISTINCT CASE WHEN ci.interaction_type = 'complaint' THEN ci.id END) as complaintCalls,
        COUNT(DISTINCT CASE WHEN ci.interaction_type = 'order_inquiry' THEN ci.id END) as orderInquiryCalls,
        COUNT(DISTINCT CASE WHEN ci.call_outcome = 'successful_order' THEN ci.id END) as successfulOrders,
        COUNT(DISTINCT CASE WHEN ci.call_outcome = 'successful_registration' THEN ci.id END) as successfulRegistrations,
        COUNT(DISTINCT CASE WHEN ci.call_outcome = 'complaint_resolved' THEN ci.id END) as complaintsResolved,
        COUNT(DISTINCT CASE WHEN ci.call_outcome = 'information_provided' THEN ci.id END) as informationProvided,
        COALESCE(SUM(ci.order_value), 0) as totalOrderValue,
        COALESCE(AVG(CASE WHEN ci.call_duration IS NOT NULL AND ci.call_duration != '' THEN CAST(ci.call_duration AS UNSIGNED) END), 0) as avgCallDuration,
        COALESCE(AVG(CASE WHEN ci.updated_at IS NOT NULL THEN TIMESTAMPDIFF(SECOND, ci.created_at, ci.updated_at) END), 0) as avgResponseTimeSeconds,
        COALESCE(AVG(CASE WHEN ci.call_outcome = 'successful_order' AND ci.updated_at IS NOT NULL
          THEN TIMESTAMPDIFF(SECOND, ci.created_at, ci.updated_at) END), 0) as avgOrderProcessingTimeSeconds,
        COUNT(DISTINCT DATE(ci.created_at)) as activeDays,
        ROUND(COUNT(DISTINCT ci.id) / NULLIF(COUNT(DISTINCT DATE(ci.created_at)), 0), 2) as avgInteractionsPerDay
      FROM admins a
      LEFT JOIN call_centre_interactions ci ON a.id = ci.operator_id ${dateCondition}
      WHERE a.role_id IN (7, 8) AND a.status = 1 AND a.id IN (9, 24)
      GROUP BY a.id, a.username, a.email, a.created_at, a.status
      ORDER BY totalInteractions DESC
    `;

    const [rows] = await this.pool.execute(query, params);
    return rows;
  }

  // Get CSR daily activity with enhanced timing metrics
  async getCSRDailyActivity(dateRange = '30d') {
    const { condition: dateCondition, params } = this.getDateCondition(dateRange, 'ci.created_at');

    const query = `
      SELECT
        a.id as csrId,
        a.username as csrName,
        DATE(ci.created_at) as date,
        COUNT(ci.id) as interactions,
        COUNT(CASE WHEN ci.interaction_type = 'new_order' THEN ci.id END) as newOrderCalls,
        COUNT(CASE WHEN ci.call_outcome = 'successful_order' THEN ci.id END) as successfulOrders,
        COUNT(CASE WHEN ci.call_outcome = 'successful_registration' THEN ci.id END) as successfulRegistrations,
        COUNT(CASE WHEN ci.interaction_type = 'complaint' THEN ci.id END) as complaintCalls,
        SUM(ci.order_value) as orderValue,
        AVG(CASE WHEN ci.updated_at IS NOT NULL
          THEN TIMESTAMPDIFF(SECOND, ci.created_at, ci.updated_at) END) as avgResponseTimeSeconds,
        ROUND((COUNT(CASE WHEN ci.call_outcome = 'successful_order' THEN ci.id END) * 100.0 /
          NULLIF(COUNT(CASE WHEN ci.interaction_type = 'new_order' THEN ci.id END), 0)), 1) as successRate,
        HOUR(ci.created_at) as hour,
        DAYNAME(ci.created_at) as dayName
      FROM admins a
      JOIN call_centre_interactions ci ON a.id = ci.operator_id
      WHERE a.role_id IN (7, 8) AND a.id IN (9, 24) ${dateCondition}
      GROUP BY a.id, a.username, DATE(ci.created_at), HOUR(ci.created_at), DAYNAME(ci.created_at)
      ORDER BY DATE(ci.created_at) DESC, HOUR(ci.created_at) ASC
    `;

    const [rows] = await this.pool.execute(query, params);
    return rows;
  }

  // Get CSR hourly performance breakdown
  async getCSRHourlyPerformance(dateRange = '30d') {
    const { condition: dateCondition, params } = this.getDateCondition(dateRange, 'ci.created_at');

    const query = `
      SELECT
        a.id as csrId,
        a.username as csrName,
        HOUR(ci.created_at) as hour,
        COUNT(ci.id) as interactions,
        COUNT(CASE WHEN ci.call_outcome = 'successful_order' THEN ci.id END) as successfulOrders,
        AVG(CASE WHEN ci.updated_at IS NOT NULL
          THEN TIMESTAMPDIFF(SECOND, ci.created_at, ci.updated_at) END) as avgResponseTimeSeconds
      FROM admins a
      JOIN call_centre_interactions ci ON a.id = ci.operator_id
      WHERE a.role_id IN (7, 8) AND a.id IN (9, 24) ${dateCondition}
      GROUP BY a.id, a.username, HOUR(ci.created_at)
      ORDER BY HOUR(ci.created_at) ASC
    `;

    const [rows] = await this.pool.execute(query, params);
    return rows;
  }

  // Get CSR interaction type breakdown
  async getCSRInteractionBreakdown(csrId, dateRange = '30d') {
    const { condition: dateCondition, params: dateParams } = this.getDateCondition(dateRange, 'ci.created_at');
    const params = [csrId, ...dateParams];

    const query = `
      SELECT
        ci.interaction_type,
        ci.call_outcome,
        COUNT(ci.id) as count,
        SUM(ci.order_value) as totalValue,
        AVG(CASE WHEN ci.updated_at IS NOT NULL
          THEN TIMESTAMPDIFF(SECOND, ci.created_at, ci.updated_at) END) as avgTimeSeconds
      FROM call_centre_interactions ci
      WHERE ci.operator_id = ? ${dateCondition}
      GROUP BY ci.interaction_type, ci.call_outcome
      ORDER BY count DESC
    `;

    const [rows] = await this.pool.execute(query, params);
    return rows;
  }

  // ==========================================
  // PACKING DASHBOARD QUERIES
  // ==========================================

  // Get all packing staff (role_id = 9 from admins table) - ENHANCED Phase 4
  async getPackingStaff(dateRange = '30d') {
    const { condition: dateCondition, params } = this.getDateCondition(dateRange, 'os.created_at');

    const query = `
      SELECT
        a.id,
        a.username as name,
        a.email,
        a.created_at as joinDate,
        a.status,

        -- Quantity Metrics
        COUNT(DISTINCT os.order_id) as totalOrdersPacked,
        COUNT(DISTINCT CASE WHEN os.status = '4' THEN os.order_id END) as ordersShipped,
        COUNT(DISTINCT CASE WHEN final_status.status = '6' THEN os.order_id END) as ordersDelivered,
        COUNT(DISTINCT CASE WHEN final_status.status = '8' THEN os.order_id END) as ordersReturned,

        -- Timing Metrics (calculated from order_statuses transitions)
        COALESCE(AVG(
          CASE WHEN os.status IN ('3', '4') AND o.created_at IS NOT NULL
          THEN TIMESTAMPDIFF(MINUTE, o.created_at, os.created_at)
          END
        ), 0) as avgPackingTimeMinutes,

        -- Time from packing to shipment
        COALESCE(AVG(
          CASE WHEN os.status = '4' AND os_shipped.created_at IS NOT NULL
          THEN TIMESTAMPDIFF(MINUTE, os.created_at, os_shipped.created_at)
          END
        ), 0) as avgTimeToShipMinutes,

        -- Productivity Metrics
        COUNT(DISTINCT DATE(os.created_at)) as activeDays,
        ROUND(COUNT(DISTINCT os.order_id) / NULLIF(COUNT(DISTINCT DATE(os.created_at)), 0), 2) as avgOrdersPerDay,

        -- Success Rate (delivered / packed)
        ROUND((COUNT(DISTINCT CASE WHEN final_status.status = '6' THEN os.order_id END) * 100.0 /
          NULLIF(COUNT(DISTINCT os.order_id), 0)), 1) as deliverySuccessRate

      FROM admins a
      LEFT JOIN order_statuses os ON a.id = os.created_by AND os.status IN ('3', '4') ${dateCondition}
      LEFT JOIN orders o ON os.order_id = o.id
      LEFT JOIN order_statuses os_shipped ON os.order_id = os_shipped.order_id AND os_shipped.status = '5'
      LEFT JOIN (
        SELECT order_id, status, MAX(created_at) as created_at
        FROM order_statuses
        WHERE status IN ('6', '7', '8')
        GROUP BY order_id, status
      ) final_status ON os.order_id = final_status.order_id
      WHERE a.role_id = 9 AND a.status = 1 AND a.id = 31
      GROUP BY a.id, a.username, a.email, a.created_at, a.status
      ORDER BY totalOrdersPacked DESC
    `;

    const [rows] = await this.pool.execute(query, params);
    return rows;
  }

  // Get packing daily activity - ENHANCED Phase 4
  async getPackingDailyActivity(dateRange = '30d') {
    const { condition: dateCondition, params } = this.getDateCondition(dateRange, 'os.created_at');

    const query = `
      SELECT
        a.id as packerId,
        a.username as packerName,
        DATE(os.created_at) as date,
        COUNT(DISTINCT os.order_id) as ordersPacked,
        COUNT(DISTINCT CASE WHEN os.status = '4' THEN os.order_id END) as ordersShipped,
        AVG(CASE WHEN os.status IN ('3', '4') AND o.created_at IS NOT NULL
          THEN TIMESTAMPDIFF(MINUTE, o.created_at, os.created_at)
        END) as avgPackingTimeMinutes,
        ROUND(AVG(CASE WHEN os.status IN ('3', '4') AND o.created_at IS NOT NULL
          THEN TIMESTAMPDIFF(MINUTE, o.created_at, os.created_at)
        END) / 60, 2) as avgPackingTimeHours,
        DAYNAME(os.created_at) as dayName
      FROM admins a
      JOIN order_statuses os ON a.id = os.created_by AND os.status IN ('3', '4')
      LEFT JOIN orders o ON os.order_id = o.id
      WHERE a.role_id = 9 AND a.id = 31 ${dateCondition}
      GROUP BY a.id, a.username, DATE(os.created_at), DAYNAME(os.created_at)
      ORDER BY DATE(os.created_at) DESC
    `;

    const [rows] = await this.pool.execute(query, params);
    return rows;
  }

  // Get packing timing breakdown - NEW Phase 4
  async getPackingTimingBreakdown(packerId, dateRange = '30d') {
    const { condition: dateCondition, params: dateParams } = this.getDateCondition(dateRange, 'os.created_at');
    const params = [packerId, ...dateParams];

    const query = `
      SELECT
        os.order_id,
        o.created_at as orderCreated,
        os.created_at as packedAt,
        os_shipped.created_at as shippedAt,
        os_delivered.created_at as deliveredAt,
        TIMESTAMPDIFF(MINUTE, o.created_at, os.created_at) as packingTimeMinutes,
        CASE WHEN os_shipped.created_at IS NOT NULL
          THEN TIMESTAMPDIFF(MINUTE, os.created_at, os_shipped.created_at)
        END as timeToShipMinutes,
        CASE WHEN os_delivered.created_at IS NOT NULL
          THEN TIMESTAMPDIFF(MINUTE, os_shipped.created_at, os_delivered.created_at)
        END as deliveryTimeMinutes,
        CASE WHEN os_delivered.created_at IS NOT NULL
          THEN TIMESTAMPDIFF(MINUTE, o.created_at, os_delivered.created_at)
        END as totalTimeMinutes
      FROM order_statuses os
      JOIN orders o ON os.order_id = o.id
      LEFT JOIN order_statuses os_shipped ON os.order_id = os_shipped.order_id AND os_shipped.status = '5'
      LEFT JOIN order_statuses os_delivered ON os.order_id = os_delivered.order_id AND os_delivered.status = '6'
      WHERE os.created_by = ? AND os.status IN ('3', '4') ${dateCondition}
      ORDER BY os.created_at DESC
      LIMIT 100
    `;

    const [rows] = await this.pool.execute(query, params);
    return rows;
  }

  // ==========================================
  // LEADERBOARD & COMPARISON QUERIES - Phase 5
  // ==========================================

  // Get CSR leaderboard with rankings
  async getCSRLeaderboard(dateRange = '30d', sortBy = 'interactions') {
    const { condition: dateCondition, params } = this.getDateCondition(dateRange, 'ci.created_at');

    const orderBy = {
      interactions: 'totalInteractions DESC',
      successRate: 'successRate DESC',
      orderValue: 'totalOrderValue DESC',
      responseTime: 'avgResponseTimeSeconds ASC'
    }[sortBy] || 'totalInteractions DESC';

    const query = `
      SELECT
        a.id,
        a.username as name,
        a.email,
        COUNT(DISTINCT ci.id) as totalInteractions,
        COUNT(DISTINCT CASE WHEN ci.call_outcome = 'successful_order' THEN ci.id END) as successfulOrders,
        COALESCE(SUM(ci.order_value), 0) as totalOrderValue,
        COALESCE(AVG(CASE WHEN ci.updated_at IS NOT NULL
          THEN TIMESTAMPDIFF(SECOND, ci.created_at, ci.updated_at) END), 0) as avgResponseTimeSeconds,
        ROUND((COUNT(DISTINCT CASE WHEN ci.call_outcome = 'successful_order' THEN ci.id END) * 100.0 /
          NULLIF(COUNT(DISTINCT CASE WHEN ci.interaction_type = 'new_order' THEN ci.id END), 0)), 1) as successRate
      FROM admins a
      LEFT JOIN call_centre_interactions ci ON a.id = ci.operator_id ${dateCondition}
      WHERE a.role_id IN (7, 8) AND a.status = 1 AND a.id IN (9, 24)
      GROUP BY a.id, a.username, a.email
      ORDER BY ${orderBy}
    `;

    const [rows] = await this.pool.execute(query, params);
    return rows.map((row, index) => ({ ...row, rank: index + 1 }));
  }

  // Get driver leaderboard based on order_statuses activity - REWRITTEN Phase 7
  async getDriverLeaderboard(dateRange = '30d', sortBy = 'deliveries') {
    const { condition: dateCondition, params } = this.getDateCondition(dateRange, 'os.created_at');

    const orderBy = {
      deliveries: 'deliveredCount DESC',
      successRate: 'deliverySuccessRate DESC',
      deliveryTime: 'avgDeliveryTimeMinutes ASC',
      productivity: 'avgOrdersPerDay DESC'
    }[sortBy] || 'deliveredCount DESC';

    const query = `
      SELECT
        db.id,
        db.name,
        db.mobile,

        -- Delivery Metrics
        COUNT(DISTINCT CASE WHEN os.status = '6' THEN os.order_id END) as deliveredCount,
        COUNT(DISTINCT CASE WHEN os.status = '5' THEN os.order_id END) as outForDeliveryCount,
        COUNT(DISTINCT os.order_id) as totalOrdersHandled,

        -- Average Delivery Time
        COALESCE(ROUND(AVG(
          CASE
            WHEN os.status = '6' AND os_out.created_at IS NOT NULL
            THEN TIMESTAMPDIFF(MINUTE, os_out.created_at, os.created_at)
          END
        ), 2), 0) as avgDeliveryTimeMinutes,

        -- Success Rate
        ROUND((COUNT(DISTINCT CASE WHEN os.status = '6' THEN os.order_id END) * 100.0 /
          NULLIF(COUNT(DISTINCT os.order_id), 0)), 1) as deliverySuccessRate,

        -- Productivity
        ROUND(COUNT(DISTINCT os.order_id) / NULLIF(COUNT(DISTINCT DATE(os.created_at)), 0), 2) as avgOrdersPerDay

      FROM order_statuses os
      INNER JOIN delivery_boys db ON os.created_by = db.id
      LEFT JOIN order_statuses os_out ON os.order_id = os_out.order_id
        AND os_out.status = '5'
        AND os_out.created_by = os.created_by
      WHERE os.status IN ('5', '6')
        AND os.user_type = 2
        ${dateCondition}
      GROUP BY db.id, db.name, db.mobile
      ORDER BY ${orderBy}
    `;

    const [rows] = await this.pool.execute(query, params);
    return rows.map((row, index) => ({ ...row, rank: index + 1 }));
  }

  // Get packing leaderboard
  async getPackingLeaderboard(dateRange = '30d', sortBy = 'packed') {
    const { condition: dateCondition, params } = this.getDateCondition(dateRange, 'os.created_at');

    const orderBy = {
      packed: 'totalOrdersPacked DESC',
      successRate: 'deliverySuccessRate DESC',
      packingTime: 'avgPackingTimeMinutes ASC',
      productivity: 'avgOrdersPerDay DESC'
    }[sortBy] || 'totalOrdersPacked DESC';

    const query = `
      SELECT
        a.id,
        a.username as name,
        COUNT(DISTINCT os.order_id) as totalOrdersPacked,
        COUNT(DISTINCT CASE WHEN final_status.status = '6' THEN os.order_id END) as ordersDelivered,
        COALESCE(AVG(
          CASE WHEN os.status IN ('3', '4') AND o.created_at IS NOT NULL
          THEN TIMESTAMPDIFF(MINUTE, o.created_at, os.created_at)
          END
        ), 0) as avgPackingTimeMinutes,
        ROUND(COUNT(DISTINCT os.order_id) / NULLIF(COUNT(DISTINCT DATE(os.created_at)), 0), 2) as avgOrdersPerDay,
        ROUND((COUNT(DISTINCT CASE WHEN final_status.status = '6' THEN os.order_id END) * 100.0 /
          NULLIF(COUNT(DISTINCT os.order_id), 0)), 1) as deliverySuccessRate
      FROM admins a
      LEFT JOIN order_statuses os ON a.id = os.created_by AND os.status IN ('3', '4') ${dateCondition}
      LEFT JOIN orders o ON os.order_id = o.id
      LEFT JOIN (
        SELECT order_id, status, MAX(created_at) as created_at
        FROM order_statuses
        WHERE status IN ('6', '7', '8')
        GROUP BY order_id, status
      ) final_status ON os.order_id = final_status.order_id
      WHERE a.role_id = 9 AND a.status = 1 AND a.id = 31
      GROUP BY a.id, a.username
      ORDER BY ${orderBy}
    `;

    const [rows] = await this.pool.execute(query, params);
    return rows.map((row, index) => ({ ...row, rank: index + 1 }));
  }

  async close() {
    if (this.pool) {
      await this.pool.end();
    }
  }
}

export default new DatabaseService();