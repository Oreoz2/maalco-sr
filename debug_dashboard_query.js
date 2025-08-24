import mysql from 'mysql2/promise';

const config = {
  host: 'localhost',
  port: 3307,
  user: 'Maalco',
  password: 'xgQCkoUmBexaitGm',
  database: 'Maalco_prod'
};

async function debugDashboardQuery() {
  let connection;
  
  try {
    console.log('Connecting to database...');
    connection = await mysql.createConnection(config);
    console.log('Connected successfully!');
    
    // Run the EXACT query from getEnhancedSalesSummary for today
    console.log('\n=== EXACT DASHBOARD QUERY (getEnhancedSalesSummary) ===');
    const exactDashboardQuery = `
      SELECT 
          COUNT(DISTINCT o.id) as totalOrders,
          COALESCE(ROUND(SUM(o.total), 2), 0) as totalOrderValue,
          COALESCE(ROUND(SUM(o.delivery_charge), 2), 0) as totalDeliveryCharges,
          COALESCE(ROUND(SUM(o.final_total), 2), 0) as totalRevenue,
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
              THEN o.final_total END), 2), 0) as srLinkedRevenue
      FROM orders o
      JOIN users u ON o.user_id = u.id
      LEFT JOIN marketing_persons mp ON u.referral_code = mp.referral_code
      INNER JOIN transactions t ON o.id = CAST(t.order_id AS UNSIGNED)
      WHERE t.status = 'success' AND DATE(o.created_at) = CURDATE()
      GROUP BY NULL
    `;
    
    const [dashboardResults] = await connection.execute(exactDashboardQuery);
    console.log('\nDashboard Summary Results:');
    console.log('Total Orders:', dashboardResults[0].totalOrders);
    console.log('Total Revenue:', dashboardResults[0].totalRevenue);
    console.log('Total Order Value:', dashboardResults[0].totalOrderValue);
    console.log('Total Delivery Charges:', dashboardResults[0].totalDeliveryCharges);
    
    // Also check individual orders in the query to see which ones are included
    console.log('\n=== INDIVIDUAL ORDERS FROM DASHBOARD QUERY ===');
    const individualOrdersQuery = `
      SELECT 
          o.id,
          o.final_total,
          o.total,
          o.delivery_charge,
          o.created_at,
          u.referral_code,
          mp.name as marketing_person_name,
          mp.status as mp_status,
          t.status as transaction_status
      FROM orders o
      JOIN users u ON o.user_id = u.id
      LEFT JOIN marketing_persons mp ON u.referral_code = mp.referral_code
      INNER JOIN transactions t ON o.id = CAST(t.order_id AS UNSIGNED)
      WHERE t.status = 'success' AND DATE(o.created_at) = CURDATE()
      ORDER BY o.id
    `;
    
    const [individualOrders] = await connection.execute(individualOrdersQuery);
    console.log('Individual orders found:', individualOrders.length);
    individualOrders.forEach(order => {
      console.log(`Order ${order.id}: $${order.final_total} (total: $${order.total}, delivery: $${order.delivery_charge}), MP: ${order.marketing_person_name || 'None'}, Status: ${order.mp_status || 'N/A'}`);
    });
    
    // Check if there are any orders today that DON'T have successful transactions
    console.log('\n=== ORDERS TODAY WITHOUT SUCCESSFUL TRANSACTIONS ===');
    const missedOrdersQuery = `
      SELECT 
          o.id,
          o.final_total,
          o.created_at,
          t.status as transaction_status,
          t.order_id
      FROM orders o
      LEFT JOIN transactions t ON o.id = CAST(t.order_id AS UNSIGNED)
      WHERE DATE(o.created_at) = CURDATE()
        AND (t.status IS NULL OR t.status != 'success')
      ORDER BY o.id
    `;
    
    const [missedOrders] = await connection.execute(missedOrdersQuery);
    console.log('Orders without successful transactions:', missedOrders.length);
    missedOrders.forEach(order => {
      console.log(`Order ${order.id}: $${order.final_total}, Transaction Status: ${order.transaction_status || 'NONE'}`);
    });
    
  } catch (error) {
    console.error('Error:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

debugDashboardQuery();