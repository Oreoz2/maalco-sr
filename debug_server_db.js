import DatabaseService from './src/services/database.js';

async function debugServerDatabase() {
  try {
    console.log('Debugging Server Database Connection...\n');
    
    // Test database connection settings used by the server
    console.log('Current NODE_ENV:', process.env.NODE_ENV);
    console.log('Database config from server:');
    console.log('- Host:', process.env.NODE_ENV === 'production' ? 'localhost' : 'localhost');
    console.log('- Port:', process.env.NODE_ENV === 'production' ? 3306 : 3307);
    
    // Check what CURDATE() returns from the server's perspective
    console.log('\n=== Database Timezone and Date Check ===');
    const connection = DatabaseService.pool || await DatabaseService.initializePool();
    
    const [dateCheck] = await connection.execute(`
      SELECT 
        NOW() as server_now,
        CURDATE() as server_curdate,
        UTC_TIMESTAMP() as utc_now
    `);
    
    console.log('Database Time Info:');
    console.log('Server NOW():', dateCheck[0].server_now);
    console.log('Server CURDATE():', dateCheck[0].server_curdate);  
    console.log('UTC NOW:', dateCheck[0].utc_now);
    
    // Check orders for today using different date approaches
    console.log('\n=== Orders using different date conditions ===');
    
    // Using CURDATE() (server's approach)
    const [ordersCurdate] = await connection.execute(`
      SELECT COUNT(*) as count, SUM(final_total) as total
      FROM orders o
      INNER JOIN transactions t ON o.id = CAST(t.order_id AS UNSIGNED)
      WHERE t.status = 'success' AND DATE(o.created_at) = CURDATE()
    `);
    console.log('Using CURDATE():', ordersCurdate[0]);
    
    // Using specific date
    const [ordersSpecific] = await connection.execute(`
      SELECT COUNT(*) as count, SUM(final_total) as total
      FROM orders o
      INNER JOIN transactions t ON o.id = CAST(t.order_id AS UNSIGNED)  
      WHERE t.status = 'success' AND DATE(o.created_at) = '2025-08-24'
    `);
    console.log('Using 2025-08-24:', ordersSpecific[0]);
    
    // Check what date the orders actually have
    console.log('\n=== Orders by date ===');
    const [ordersByDate] = await connection.execute(`
      SELECT 
        DATE(o.created_at) as order_date,
        COUNT(*) as count,
        SUM(o.final_total) as total,
        GROUP_CONCAT(o.id ORDER BY o.id) as order_ids
      FROM orders o
      INNER JOIN transactions t ON o.id = CAST(t.order_id AS UNSIGNED)
      WHERE t.status = 'success' 
        AND o.created_at >= '2025-08-23 00:00:00'
        AND o.created_at <= '2025-08-24 23:59:59'
      GROUP BY DATE(o.created_at)
      ORDER BY order_date DESC
    `);
    
    ordersByDate.forEach(row => {
      console.log(`Date ${row.order_date}: ${row.count} orders, $${row.total}, IDs: ${row.order_ids}`);
    });
    
  } catch (error) {
    console.error('Error:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await DatabaseService.close();
  }
}

debugServerDatabase();