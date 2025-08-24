import mysql from 'mysql2/promise';

const config = {
  host: 'localhost',
  port: 3307,
  user: 'Maalco',
  password: 'xgQCkoUmBexaitGm',
  database: 'Maalco_prod'
};

async function debugOrders() {
  let connection;
  
  try {
    console.log('Connecting to database...');
    connection = await mysql.createConnection(config);
    console.log('Connected successfully!');
    
    // 1. Check today's orders (specific IDs from platform data)
    console.log('\n=== 1. ORDERS TABLE - Today\'s Orders (736, 734, 732, 731) ===');
    const [orders] = await connection.execute(
      'SELECT id, user_id, final_total, total, delivery_charge, status, created_at FROM orders WHERE id IN (736, 734, 732, 731) ORDER BY id'
    );
    
    console.log('Orders found:', orders.length);
    orders.forEach(order => {
      console.log(`Order ${order.id}: $${order.final_total}, Status: ${order.status}, Date: ${order.created_at}`);
    });
    
    // 2. Check transactions for these orders
    console.log('\n=== 2. TRANSACTIONS TABLE - Transactions for these orders ===');
    const [transactions] = await connection.execute(
      'SELECT order_id, status, created_at, amount FROM transactions WHERE order_id IN ("736", "734", "732", "731") ORDER BY order_id'
    );
    
    console.log('Transactions found:', transactions.length);
    transactions.forEach(txn => {
      console.log(`Order ${txn.order_id}: Status: ${txn.status}, Amount: $${txn.amount}, Date: ${txn.created_at}`);
    });
    
    // 3. Check what the dashboard query actually returns for today
    console.log('\n=== 3. DASHBOARD QUERY RESULT - What dashboard sees today ===');
    const [dashboardResult] = await connection.execute(`
      SELECT 
        o.id,
        o.final_total,
        o.created_at,
        t.status as transaction_status,
        t.order_id as transaction_order_id
      FROM orders o
      JOIN users u ON o.user_id = u.id
      INNER JOIN transactions t ON o.id = CAST(t.order_id AS UNSIGNED)
      WHERE t.status = 'success' 
        AND DATE(o.created_at) = CURDATE()
        AND o.id IN (736, 734, 732, 731)
      ORDER BY o.id
    `);
    
    console.log('Dashboard query results:', dashboardResult.length, 'orders');
    dashboardResult.forEach(result => {
      console.log(`Order ${result.id}: $${result.final_total}, Transaction Status: ${result.transaction_status}`);
    });
    
    // 4. Check all orders for today (regardless of transaction status) 
    console.log('\n=== 4. ALL ORDERS TODAY - Compare with successful transactions ===');
    const [allTodayOrders] = await connection.execute(`
      SELECT 
        o.id,
        o.final_total,
        o.created_at,
        t.status as transaction_status
      FROM orders o
      LEFT JOIN transactions t ON o.id = CAST(t.order_id AS UNSIGNED)
      WHERE DATE(o.created_at) = CURDATE()
        AND o.id IN (736, 734, 732, 731)
      ORDER BY o.id
    `);
    
    console.log('All today\'s orders (platform data):');
    allTodayOrders.forEach(order => {
      const status = order.transaction_status === 'success' ? 'INCLUDED' : 'EXCLUDED';
      console.log(`Order ${order.id}: $${order.final_total}, Transaction: ${order.transaction_status || 'NONE'}, Dashboard: ${status}`);
    });
    
    // 5. Summary
    console.log('\n=== 5. SUMMARY ===');
    const totalPlatformValue = allTodayOrders.reduce((sum, order) => sum + parseFloat(order.final_total || 0), 0);
    const includedOrders = allTodayOrders.filter(order => order.transaction_status === 'success');
    const totalDashboardValue = includedOrders.reduce((sum, order) => sum + parseFloat(order.final_total || 0), 0);
    
    console.log(`Platform total: $${totalPlatformValue.toFixed(2)} (${allTodayOrders.length} orders)`);
    console.log(`Dashboard total: $${totalDashboardValue.toFixed(2)} (${includedOrders.length} orders)`);
    console.log(`Missing: $${(totalPlatformValue - totalDashboardValue).toFixed(2)}`);
    
    const excludedOrders = allTodayOrders.filter(order => order.transaction_status !== 'success');
    if (excludedOrders.length > 0) {
      console.log('\nExcluded orders:');
      excludedOrders.forEach(order => {
        console.log(`  - Order ${order.id}: $${order.final_total} (Transaction: ${order.transaction_status || 'MISSING'})`);
      });
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

debugOrders();