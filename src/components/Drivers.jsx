import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Truck, Trophy, DollarSign, TrendingUp, Clock } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import ApiService from '../services/apiService';
import DateRangePicker from './ui/date-range-picker.jsx';

const Drivers = () => {
  const [drivers, setDrivers] = useState([]);
  const [trends, setTrends] = useState([]);
  const [dateRange, setDateRange] = useState('30d');
  const [loading, setLoading] = useState(true);
  const [uploadingDriverId, setUploadingDriverId] = useState(null);
  const fileInputRefs = useRef({});

  const periods = [
    { label: 'Today', value: 'today' },
    { label: 'This Week', value: '7d' },
    { label: 'This Month', value: '30d' }
  ];

  useEffect(() => {
    fetchData();
  }, [dateRange]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [driversData, trendsData] = await Promise.all([
        ApiService.getDrivers(dateRange),
        ApiService.getDriverTrends(dateRange)
      ]);
      setDrivers(driversData);
      setTrends(trendsData);
    } catch (error) {
      console.error('Error fetching drivers data:', error);
    }
    setLoading(false);
  };

  const handleImageUpload = async (event, driverId) => {
    const file = event.target.files[0];
    if (!file) return;

    setUploadingDriverId(driverId);
    try {
      await ApiService.uploadDriverImage(driverId, file);
      await fetchData(); // Refresh driver data to show new image
    } catch (error) {
      console.error('Error uploading driver image:', error);
      alert('Failed to upload image. Please try again.');
    } finally {
      setUploadingDriverId(null);
    }
  };

  // Calculate summary metrics
  const totalDeliveries = drivers.reduce((sum, d) => sum + d.deliveredCount, 0);
  const totalOrdersAssigned = drivers.reduce((sum, d) => sum + d.totalOrdersAssigned, 0);
  const avgDeliveryTime = drivers.length > 0
    ? (drivers.reduce((sum, d) => sum + parseFloat(d.avgDeliveryTimeMinutes), 0) / drivers.length).toFixed(1)
    : 0;
  const avgSuccessRate = drivers.length > 0
    ? (drivers.reduce((sum, d) => sum + parseFloat(d.deliverySuccessRate), 0) / drivers.length).toFixed(1)
    : 0;

  // Format trends for chart
  const chartData = trends.reduce((acc, item) => {
    const date = new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const existing = acc.find(d => d.date === date);
    if (existing) {
      existing[item.driverName] = (existing[item.driverName] || 0) + item.delivered;
    } else {
      acc.push({ date, [item.driverName]: item.delivered });
    }
    return acc;
  }, []).reverse();

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { type: 'spring', stiffness: 100 }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Truck className="h-12 w-12 animate-bounce mx-auto text-blue-600" />
          <p className="mt-4 text-lg text-gray-600">Loading drivers data...</p>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 p-6"
    >
      {/* Header */}
      <motion.div variants={itemVariants} className="mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Truck className="h-8 w-8 text-blue-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Drivers Dashboard</h1>
              <p className="text-gray-600">Monitor delivery performance and driver metrics</p>
            </div>
          </div>
          <Trophy className="h-10 w-10 text-yellow-500" />
        </div>
      </motion.div>

      {/* Date Range Selector */}
      <motion.div variants={itemVariants} className="mb-6 flex justify-center">
        <div className="flex bg-white rounded-lg border border-gray-200 shadow-sm p-1 gap-1">
          {periods.map((period) => (
            <Button
              key={period.value}
              variant={dateRange === period.value ? "default" : "ghost"}
              onClick={() => setDateRange(period.value)}
              className={`px-6 py-2 rounded-md transition-all duration-200 ${
                dateRange === period.value
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              {period.label}
            </Button>
          ))}
          <DateRangePicker
            onDateRangeChange={setDateRange}
            selectedPeriod={dateRange}
          />
        </div>
      </motion.div>

      {/* Summary Cards */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-medium flex items-center gap-2">
              <Truck className="h-5 w-5" />
              Total Deliveries
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{totalDeliveries}</div>
            <p className="text-blue-100 text-sm mt-1">Completed deliveries</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-medium flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Success Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{avgSuccessRate}%</div>
            <p className="text-green-100 text-sm mt-1">Average success rate</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-yellow-500 to-yellow-600 text-white">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-medium flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Avg Delivery Time
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{avgDeliveryTime}m</div>
            <p className="text-yellow-100 text-sm mt-1">Minutes per delivery</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-indigo-500 to-indigo-600 text-white">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-medium flex items-center gap-2">
              <Truck className="h-5 w-5" />
              Active Drivers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{drivers.length}</div>
            <p className="text-indigo-100 text-sm mt-1">Assigned {totalOrdersAssigned} orders</p>
          </CardContent>
        </Card>
      </motion.div>

      {/* Performance Trends Chart */}
      <motion.div variants={itemVariants} className="mb-8">
        <Card>
          <CardHeader>
            <CardTitle>Delivery Performance Trends</CardTitle>
            <CardDescription>Daily deliveries per driver over time</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                {drivers.map((driver, index) => (
                  <Line
                    key={driver.id}
                    type="monotone"
                    dataKey={driver.name}
                    stroke={`hsl(${index * 90}, 70%, 50%)`}
                    strokeWidth={2}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </motion.div>

      {/* Drivers Grid */}
      <motion.div variants={itemVariants}>
        <h2 className="text-2xl font-bold mb-4 text-gray-900">Driver Performance</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {drivers.map((driver) => (
            <motion.div
              key={driver.id}
              variants={itemVariants}
              whileHover={{ scale: 1.03 }}
              className="relative"
            >
              <Card className="h-full hover:shadow-xl transition-shadow">
                <CardHeader className="text-center pb-4">
                  <div className="mx-auto mb-4 relative">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleImageUpload(e, driver.id)}
                      style={{ display: 'none' }}
                      ref={(el) => (fileInputRefs.current[driver.id] = el)}
                    />
                    <img
                      src={driver.profileImage}
                      alt={driver.name}
                      onClick={() => fileInputRefs.current[driver.id]?.click()}
                      className="w-24 h-24 rounded-full object-cover border-4 border-blue-200 shadow-lg cursor-pointer hover:opacity-80 transition-opacity"
                      title="Click to upload new image"
                    />
                    {uploadingDriverId === driver.id && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-full">
                        <span className="text-white text-xs">Uploading...</span>
                      </div>
                    )}
                    <Badge className="absolute bottom-0 right-0 bg-green-500">
                      Active
                    </Badge>
                  </div>
                  <CardTitle className="text-lg">{driver.name}</CardTitle>
                  <CardDescription className="text-sm">{driver.mobile}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Delivered</span>
                      <span className="font-semibold text-blue-600">{driver.deliveredCount}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Success Rate</span>
                      <span className="font-semibold text-green-600">{driver.deliverySuccessRate}%</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Avg Delivery Time</span>
                      <span className="font-semibold text-yellow-600">{driver.avgDeliveryTimeMinutes.toFixed(1)}m</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Orders/Day</span>
                      <span className="font-semibold text-indigo-600">{driver.avgOrdersPerDay.toFixed(1)}</span>
                    </div>
                    <div className="pt-3 border-t">
                      <div className="flex justify-between text-xs text-gray-500">
                        <span>Out: {driver.outForDeliveryCount}</span>
                        <span>Active Days: {driver.activeDays}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
};

export default Drivers;
