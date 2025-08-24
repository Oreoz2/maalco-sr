import DatabaseService from './src/services/database.js';

async function testSalesAPI() {
  try {
    console.log('Testing Sales API for today...\n');
    
    // Test the exact function used by the /sales/summary API endpoint
    const summary = await DatabaseService.getEnhancedSalesSummary('today');
    
    console.log('Raw Database Results:');
    console.log('Total Orders:', summary.totalOrders);
    console.log('Total Order Value:', summary.totalOrderValue);  
    console.log('Total Delivery Charges:', summary.totalDeliveryCharges);
    console.log('Total Revenue:', summary.totalRevenue);
    console.log('Unique Customers:', summary.uniqueCustomers);
    console.log('Average Order Value:', summary.avgOrderValue);
    console.log('SR Linked Orders:', summary.srLinkedOrders);
    console.log('SR Linked Revenue:', summary.srLinkedRevenue);
    
    console.log('\nFormatted API Response (what frontend receives):');
    const apiResponse = {
      totalOrders: parseInt(summary.totalOrders) || 0,
      totalOrderValue: parseFloat(summary.totalOrderValue) || 0,
      totalDeliveryCharges: parseFloat(summary.totalDeliveryCharges) || 0,
      totalRevenue: parseFloat(summary.totalRevenue) || 0,
      uniqueCustomers: parseInt(summary.uniqueCustomers) || 0,
      uniqueReferralCodes: parseInt(summary.uniqueReferralCodes) || 0,
      avgOrderValue: parseFloat(summary.avgOrderValue) || 0,
      avgOrderTotal: parseFloat(summary.avgOrderTotal) || 0,
      avgDeliveryCharge: parseFloat(summary.avgDeliveryCharge) || 0,
      activeDays: parseInt(summary.activeDays) || 0,
      srLinkedOrders: parseInt(summary.srLinkedOrders) || 0,
      srLinkedOrderTotal: parseFloat(summary.srLinkedOrderTotal) || 0,
      srLinkedDeliveryCharges: parseFloat(summary.srLinkedDeliveryCharges) || 0,
      srLinkedRevenue: parseFloat(summary.srLinkedRevenue) || 0,
      srLinkedPercentage: summary.totalOrders > 0 
        ? ((summary.srLinkedOrders / summary.totalOrders) * 100).toFixed(1)
        : 0
    };
    
    console.log(JSON.stringify(apiResponse, null, 2));
    
    // Test sales trends too
    console.log('\n=== Testing Sales Trends for today ===');
    const trends = await DatabaseService.getEnhancedSalesTrends('today');
    console.log('Trends count:', trends.length);
    trends.forEach(trend => {
      console.log(`Date: ${trend.date}, Orders: ${trend.totalOrders}, Revenue: ${trend.totalRevenue}`);
    });
    
  } catch (error) {
    console.error('Error:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await DatabaseService.close();
  }
}

testSalesAPI();