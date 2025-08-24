import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card.jsx';
import { Button } from '@/components/ui/button.jsx';
import { Badge } from '@/components/ui/badge.jsx';
import { 
  ShoppingCart, 
  DollarSign, 
  Users, 
  TrendingUp,
  Crown,
  Star,
  Target,
  Calendar,
  RefreshCw,
  Download,
  Receipt,
  CreditCard,
  Percent
} from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { motion } from 'framer-motion';
import ApiService from '../services/apiService';
import DateRangePicker from './ui/date-range-picker.jsx';

function Sales() {
  const [selectedPeriod, setSelectedPeriod] = useState('30d');
  const [salesData, setSalesData] = useState({
    totalOrders: 0,
    totalOrderValue: 0,
    totalDeliveryCharges: 0,
    totalRevenue: 0,
    uniqueCustomers: 0,
    uniqueReferralCodes: 0,
    avgOrderValue: 0,
    avgOrderTotal: 0,
    avgDeliveryCharge: 0,
    activeDays: 0,
    srLinkedOrders: 0,
    srLinkedOrderTotal: 0,
    srLinkedDeliveryCharges: 0,
    srLinkedRevenue: 0,
    srLinkedPercentage: 0
  });
  const [trends, setTrends] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const periods = [
    { label: 'Today', value: 'today' },
    { label: 'This Week', value: '7d' },
    { label: 'This Month', value: '30d' },
    { label: 'All Time', value: 'all' }
  ];

  // Load sales data
  const loadSalesData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [summary, trendsData] = await Promise.all([
        ApiService.getSalesSummary(selectedPeriod),
        ApiService.getSalesTrends(selectedPeriod)
      ]);

      setSalesData(summary);
      setTrends(trendsData);
    } catch (err) {
      console.error('Error loading sales data:', err);
      setError('Failed to load sales data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSalesData();
  }, [selectedPeriod]);

  // Export data functionality
  const handleExport = async () => {
    try {
      await ApiService.exportData(selectedPeriod, 'csv');
    } catch (err) {
      console.error('Export failed:', err);
    }
  };

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.6,
        ease: "easeOut"
      }
    }
  };

  // Prepare chart data
  const trendChartData = trends.map(trend => ({
    date: new Date(trend.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    totalOrderValue: trend.totalOrderValue,
    totalDeliveryCharges: trend.totalDeliveryCharges,
    totalRevenue: trend.totalRevenue,
    totalOrders: trend.totalOrders,
    srLinkedOrderTotal: trend.srLinkedOrderTotal,
    srLinkedDeliveryCharges: trend.srLinkedDeliveryCharges,
    srLinkedRevenue: trend.srLinkedRevenue,
    srLinkedOrders: trend.srLinkedOrders,
    avgOrderValue: trend.avgOrderValue,
    avgOrderTotal: trend.avgOrderTotal,
    avgDeliveryCharge: trend.avgDeliveryCharge,
    uniqueCustomers: trend.uniqueCustomers,
    fullDate: trend.date
  })).reverse();

  if (loading && trends.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <RefreshCw className="w-16 h-16 animate-spin mx-auto mb-4 text-green-600" />
          <p className="text-gray-600">Loading sales data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="text-red-600 mb-4">⚠️ Error</div>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={loadSalesData} className="bg-red-600 hover:bg-red-700">
            <RefreshCw className="w-4 h-4 mr-2" />
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <motion.div 
      className="space-y-8"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Header */}
      <motion.div variants={itemVariants} className="flex justify-between items-center">
        <div className="text-center flex-1">
          <h1 className="text-4xl font-bold text-gray-900 mb-2 flex items-center justify-center">
            <ShoppingCart className="w-10 h-10 mr-3 text-green-600" />
            Platform Sales
          </h1>
          <p className="text-xl text-gray-600">Complete view of all sales and revenue across the platform</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={loadSalesData}
            disabled={loading}
            className="text-gray-600 border-gray-300 hover:border-green-600"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button
            variant="outline"
            onClick={handleExport}
            className="text-gray-600 border-gray-300 hover:border-green-600"
          >
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </motion.div>

      {/* Period Selector */}
      <motion.div variants={itemVariants} className="flex justify-center">
        <div className="flex bg-white rounded-lg border border-gray-200 shadow-sm p-1 gap-1">
          {periods.map((period) => (
            <Button
              key={period.value}
              variant={selectedPeriod === period.value ? "default" : "ghost"}
              onClick={() => setSelectedPeriod(period.value)}
              className={`px-6 py-2 rounded-md transition-all duration-200 ${
                selectedPeriod === period.value
                  ? 'bg-green-600 text-white shadow-md'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              {period.label}
            </Button>
          ))}
          <DateRangePicker 
            onDateRangeChange={setSelectedPeriod}
            selectedPeriod={selectedPeriod}
          />
        </div>
      </motion.div>

      {/* Key Metrics */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-5 gap-6">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 hover:shadow-lg transition-shadow duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-blue-700">
              Order Total
            </CardTitle>
            <Receipt className="h-6 w-6 text-blue-600" />
          </CardHeader>
          <CardContent>
            <motion.div 
              className="text-3xl font-bold text-blue-800"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.5, type: "spring", stiffness: 200 }}
            >
              ${salesData.totalOrderValue.toFixed(2)}
            </motion.div>
            <p className="text-xs text-blue-600 mt-1 flex items-center">
              <TrendingUp className="w-3 h-3 mr-1" />
              Avg ${salesData.avgOrderTotal.toFixed(2)} per order
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200 hover:shadow-lg transition-shadow duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-yellow-700">
              Delivery Charges
            </CardTitle>
            <CreditCard className="h-6 w-6 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <motion.div 
              className="text-3xl font-bold text-yellow-800"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.6, type: "spring", stiffness: 200 }}
            >
              ${salesData.totalDeliveryCharges.toFixed(2)}
            </motion.div>
            <p className="text-xs text-yellow-600 mt-1 flex items-center">
              <TrendingUp className="w-3 h-3 mr-1" />
              Avg ${salesData.avgDeliveryCharge.toFixed(2)} per order
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200 hover:shadow-lg transition-shadow duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-green-700">
              Total Revenue
            </CardTitle>
            <DollarSign className="h-6 w-6 text-green-600" />
          </CardHeader>
          <CardContent>
            <motion.div 
              className="text-3xl font-bold text-green-800"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.7, type: "spring", stiffness: 200 }}
            >
              ${salesData.totalRevenue.toFixed(2)}
            </motion.div>
            <p className="text-xs text-green-600 mt-1 flex items-center">
              <Receipt className="w-3 h-3 mr-1" />
              {salesData.totalOrders} orders
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200 hover:shadow-lg transition-shadow duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-purple-700">
              Unique Customers
            </CardTitle>
            <Users className="h-6 w-6 text-purple-600" />
          </CardHeader>
          <CardContent>
            <motion.div 
              className="text-3xl font-bold text-purple-800"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.8, type: "spring", stiffness: 200 }}
            >
              {salesData.uniqueCustomers.toLocaleString()}
            </motion.div>
            <p className="text-xs text-purple-600 mt-1 flex items-center">
              <Calendar className="w-3 h-3 mr-1" />
              {salesData.activeDays} active days
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200 hover:shadow-lg transition-shadow duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-orange-700">
              SR-Linked Sales
            </CardTitle>
            <Target className="h-6 w-6 text-orange-600" />
          </CardHeader>
          <CardContent>
            <motion.div 
              className="text-3xl font-bold text-orange-800"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.9, type: "spring", stiffness: 200 }}
            >
              ${salesData.srLinkedRevenue.toFixed(2)}
            </motion.div>
            <p className="text-xs text-orange-600 mt-1 flex items-center">
              <Percent className="w-3 h-3 mr-1" />
              {salesData.srLinkedPercentage}% of total
            </p>
          </CardContent>
        </Card>
      </motion.div>

      {/* Charts Section */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Trend Chart */}
        <Card className="hover:shadow-lg transition-shadow duration-300">
          <CardHeader>
            <CardTitle className="flex items-center">
              <TrendingUp className="w-5 h-5 mr-2 text-green-600" />
              Revenue Trend
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={trendChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis 
                  dataKey="date" 
                  tick={{ fontSize: 12 }}
                />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip 
                  labelFormatter={(value) => new Date(trendChartData.find(d => d.date === value)?.fullDate).toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    month: 'short', 
                    day: 'numeric' 
                  })}
                  formatter={(value, name) => [
                    name.includes('Revenue') ? `$${value.toFixed(2)}` : value,
                    name === 'totalRevenue' ? 'Total Revenue' :
                    name === 'srLinkedRevenue' ? 'SR-Linked Revenue' : name
                  ]}
                />
                <Area
                  type="monotone"
                  dataKey="totalRevenue"
                  stackId="1"
                  stroke="#16a34a"
                  fill="#16a34a"
                  fillOpacity={0.6}
                />
                <Area
                  type="monotone"
                  dataKey="srLinkedRevenue"
                  stackId="2"
                  stroke="#eab308"
                  fill="#eab308"
                  fillOpacity={0.8}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Order Volume Chart */}
        <Card className="hover:shadow-lg transition-shadow duration-300">
          <CardHeader>
            <CardTitle className="flex items-center">
              <ShoppingCart className="w-5 h-5 mr-2 text-blue-600" />
              Order Volume Trend
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={trendChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis 
                  dataKey="date" 
                  tick={{ fontSize: 12 }}
                />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip 
                  labelFormatter={(value) => new Date(trendChartData.find(d => d.date === value)?.fullDate).toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    month: 'short', 
                    day: 'numeric' 
                  })}
                  formatter={(value, name) => [
                    value,
                    name === 'totalOrders' ? 'Total Orders' :
                    name === 'srLinkedOrders' ? 'SR-Linked Orders' : name
                  ]}
                />
                <Bar 
                  dataKey="totalOrders" 
                  fill="#2563eb"
                  radius={[4, 4, 0, 0]}
                />
                <Bar 
                  dataKey="srLinkedOrders" 
                  fill="#eab308"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </motion.div>

      {/* Detailed Metrics */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Average Order Value Chart */}
        <Card className="hover:shadow-lg transition-shadow duration-300">
          <CardHeader>
            <CardTitle className="flex items-center">
              <DollarSign className="w-5 h-5 mr-2 text-purple-600" />
              Average Order Value Trend
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={trendChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis 
                  dataKey="date" 
                  tick={{ fontSize: 12 }}
                />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip 
                  labelFormatter={(value) => new Date(trendChartData.find(d => d.date === value)?.fullDate).toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    month: 'short', 
                    day: 'numeric' 
                  })}
                  formatter={(value) => [`$${value.toFixed(2)}`, 'Avg Order Value']}
                />
                <Line 
                  type="monotone" 
                  dataKey="avgOrderValue" 
                  stroke="#9333ea" 
                  strokeWidth={3}
                  dot={{ fill: '#9333ea', strokeWidth: 2, r: 6 }}
                  activeDot={{ r: 8, stroke: '#9333ea', strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Customer Activity Chart */}
        <Card className="hover:shadow-lg transition-shadow duration-300">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Users className="w-5 h-5 mr-2 text-indigo-600" />
              Daily Customer Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={trendChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis 
                  dataKey="date" 
                  tick={{ fontSize: 12 }}
                />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip 
                  labelFormatter={(value) => new Date(trendChartData.find(d => d.date === value)?.fullDate).toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    month: 'short', 
                    day: 'numeric' 
                  })}
                  formatter={(value) => [value, 'Unique Customers']}
                />
                <Bar 
                  dataKey="uniqueCustomers" 
                  fill="#6366f1"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </motion.div>

      {/* Sales Performance Summary */}
      <motion.div variants={itemVariants}>
        <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200 shadow-lg">
          <CardHeader>
            <CardTitle className="text-center text-green-900 flex items-center justify-center">
              <Target className="w-6 h-6 mr-2" />
              Sales Performance Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
              <div className="space-y-2">
                <div className="text-3xl font-bold text-green-700">
                  {salesData.totalOrders > 0 ? ((salesData.uniqueCustomers / salesData.totalOrders) * 100).toFixed(1) : 0}%
                </div>
                <p className="text-green-600 font-medium">Customer Retention Rate</p>
                <p className="text-sm text-green-500">Orders per unique customer</p>
              </div>
              
              <div className="space-y-2">
                <div className="text-3xl font-bold text-emerald-700">
                  ${((salesData.totalRevenue / Math.max(salesData.activeDays, 1))).toFixed(0)}
                </div>
                <p className="text-emerald-600 font-medium">Daily Average Revenue</p>
                <p className="text-sm text-emerald-500">Revenue per active day</p>
              </div>
              
              <div className="space-y-2">
                <div className="text-3xl font-bold text-teal-700">
                  {(salesData.totalOrders / Math.max(salesData.activeDays, 1)).toFixed(1)}
                </div>
                <p className="text-teal-600 font-medium">Daily Average Orders</p>
                <p className="text-sm text-teal-500">Orders per active day</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}

export default Sales;