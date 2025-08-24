// Database service for read-only queries
import mysql from 'mysql2/promise';

class DatabaseService {
  constructor() {
    this.pool = null;
    this.initializePool();
  }

  initializePool() {
    const config = {
      host: process.env.NODE_ENV === 'production' ? 'localhost' : 'localhost',
      port: process.env.NODE_ENV === 'production' ? 3306 : 3307, // Use tunnel port for development
      user: 'Maalco',
      password: 'xgQCkoUmBexaitGm',
      database: 'Maalco_prod',
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      acquireTimeout: 60000,
      timeout: 60000,
    };

    this.pool = mysql.createPool(config);
  }

  // Parse date range into SQL conditions
  getDateRange(dateRange = '7d') {
    const now = new Date();
    let startDate, endDate = now;

    switch (dateRange) {
      case 'today':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case 'yesterday':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
        endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '3m':
        startDate = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate());
        break;
      case '6m':
        startDate = new Date(now.getFullYear(), now.getMonth() - 6, now.getDate());
        break;
      case '1y':
        startDate = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
        break;
      default:
        if (dateRange.startsWith('custom:')) {
          const [, start, end] = dateRange.split(':');
          startDate = new Date(start);
          endDate = new Date(end);
        } else {
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        }
    }

    return { startDate, endDate };
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
        COUNT(DISTINCT CASE WHEN o.status != '1' THEN o.id END) as totalOrders,
        COALESCE(SUM(CASE WHEN o.status != '1' THEN o.final_total END), 0) as totalOrderValue
      FROM marketing_persons mp
      LEFT JOIN users u ON mp.referral_code = u.referral_code ${dateCondition}
      LEFT JOIN orders o ON u.id = o.user_id AND o.status != '1'
      WHERE mp.status = 1
        AND mp.name NOT IN ('ggh', 'gmg', 'gh', 'tuii', 'Marketing Person')
        AND mp.name NOT LIKE '%test%'
        AND mp.name NOT LIKE '%@%'
        AND LENGTH(mp.name) > 3
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

  // Get dashboard summary stats
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
        COUNT(DISTINCT CASE WHEN o.status != '1' THEN o.id END) as totalOrders,
        COALESCE(SUM(CASE WHEN o.status != '1' THEN o.final_total END), 0) as totalOrderValue,
        COUNT(DISTINCT mp.id) as totalActiveSRs
      FROM marketing_persons mp
      LEFT JOIN users u ON mp.referral_code = u.referral_code ${dateCondition}
      LEFT JOIN orders o ON u.id = o.user_id AND o.status != '1'
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

  async close() {
    if (this.pool) {
      await this.pool.end();
    }
  }
}

export default new DatabaseService();