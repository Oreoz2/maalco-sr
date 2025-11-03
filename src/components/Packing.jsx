import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Package, Trophy, TrendingUp, CheckCircle, XCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import ApiService from '../services/apiService';
import DateRangePicker from './ui/date-range-picker.jsx';

const Packing = () => {
  const [packingStaff, setPackingStaff] = useState([]);
  const [trends, setTrends] = useState([]);
  const [dateRange, setDateRange] = useState('30d');
  const [loading, setLoading] = useState(true);
  const [uploadingPackerId, setUploadingPackerId] = useState(null);
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
      const [packingData, trendsData] = await Promise.all([
        ApiService.getPackingStaff(dateRange),
        ApiService.getPackingTrends(dateRange)
      ]);
      setPackingStaff(packingData);
      setTrends(trendsData);
    } catch (error) {
      console.error('Error fetching packing data:', error);
    }
    setLoading(false);
  };

  const handleImageUpload = async (event, packerId) => {
    const file = event.target.files[0];
    if (!file) return;

    setUploadingPackerId(packerId);
    try {
      await ApiService.uploadPackingImage(packerId, file);
      await fetchData(); // Refresh packing data to show new image
    } catch (error) {
      console.error('Error uploading packing image:', error);
      alert('Failed to upload image. Please try again.');
    } finally {
      setUploadingPackerId(null);
    }
  };

  // Calculate summary metrics
  const totalPacked = packingStaff.reduce((sum, p) => sum + p.totalOrdersPacked, 0);
  const totalShipped = packingStaff.reduce((sum, p) => sum + p.ordersShipped, 0);
  const totalDelivered = packingStaff.reduce((sum, p) => sum + p.ordersDelivered, 0);
  const totalReturned = packingStaff.reduce((sum, p) => sum + p.ordersReturned, 0);
  const avgSuccessRate = packingStaff.length > 0
    ? (packingStaff.reduce((sum, p) => sum + parseFloat(p.successRate), 0) / packingStaff.length).toFixed(1)
    : 0;

  // Format trends for chart
  const chartData = trends.reduce((acc, item) => {
    const date = new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const existing = acc.find(d => d.date === date);
    if (existing) {
      existing.packed = (existing.packed || 0) + item.ordersPacked;
      existing.shipped = (existing.shipped || 0) + item.ordersShipped;
    } else {
      acc.push({
        date,
        packed: item.ordersPacked,
        shipped: item.ordersShipped
      });
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
          <Package className="h-12 w-12 animate-bounce mx-auto text-orange-600" />
          <p className="mt-4 text-lg text-gray-600">Loading packing data...</p>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-50 p-6"
    >
      {/* Header */}
      <motion.div variants={itemVariants} className="mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-orange-100 rounded-lg">
              <Package className="h-8 w-8 text-orange-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Packing Dashboard</h1>
              <p className="text-gray-600">Monitor packing team performance and order fulfillment</p>
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
                  ? 'bg-orange-600 text-white shadow-md'
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
        <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-medium flex items-center gap-2">
              <Package className="h-5 w-5" />
              Orders Packed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{totalPacked}</div>
            <p className="text-orange-100 text-sm mt-1">Total orders processed</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-medium flex items-center gap-2">
              <CheckCircle className="h-5 w-5" />
              Success Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{avgSuccessRate}%</div>
            <p className="text-green-100 text-sm mt-1">{totalDelivered} delivered successfully</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-medium flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Orders Shipped
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{totalShipped}</div>
            <p className="text-blue-100 text-sm mt-1">Ready for delivery</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-500 to-red-600 text-white">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-medium flex items-center gap-2">
              <XCircle className="h-5 w-5" />
              Returns
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{totalReturned}</div>
            <p className="text-red-100 text-sm mt-1">Orders returned</p>
          </CardContent>
        </Card>
      </motion.div>

      {/* Performance Trends Chart */}
      <motion.div variants={itemVariants} className="mb-8">
        <Card>
          <CardHeader>
            <CardTitle>Packing Performance Trends</CardTitle>
            <CardDescription>Daily packing and shipping activity over time</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="packed" fill="#f97316" name="Packed" />
                <Bar dataKey="shipped" fill="#3b82f6" name="Shipped" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </motion.div>

      {/* Packing Staff Grid */}
      <motion.div variants={itemVariants}>
        <h2 className="text-2xl font-bold mb-4 text-gray-900">Packing Team Performance</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {packingStaff.map((packer) => (
            <motion.div
              key={packer.id}
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
                      onChange={(e) => handleImageUpload(e, packer.id)}
                      style={{ display: 'none' }}
                      ref={(el) => (fileInputRefs.current[packer.id] = el)}
                    />
                    <img
                      src={packer.profileImage}
                      alt={packer.name}
                      onClick={() => fileInputRefs.current[packer.id]?.click()}
                      className="w-24 h-24 rounded-full object-cover border-4 border-orange-200 shadow-lg cursor-pointer hover:opacity-80 transition-opacity"
                      title="Click to upload new image"
                    />
                    {uploadingPackerId === packer.id && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-full">
                        <span className="text-white text-xs">Uploading...</span>
                      </div>
                    )}
                    <Badge className="absolute bottom-0 right-0 bg-green-500">
                      Active
                    </Badge>
                  </div>
                  <CardTitle className="text-lg">{packer.name}</CardTitle>
                  <CardDescription className="text-sm">{packer.email}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm text-gray-600">Success Rate</span>
                        <span className="text-2xl font-bold text-green-600">{packer.successRate}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-green-500 h-2 rounded-full transition-all"
                          style={{ width: `${packer.successRate}%` }}
                        />
                      </div>
                    </div>
                    <div className="space-y-3 pt-3 border-t">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Total Packed</span>
                        <span className="font-semibold text-orange-600">{packer.totalOrdersPacked}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Shipped</span>
                        <span className="font-semibold text-blue-600">{packer.ordersShipped}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Delivered</span>
                        <span className="font-semibold text-green-600">{packer.ordersDelivered}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Returned</span>
                        <span className="font-semibold text-red-600">{packer.ordersReturned}</span>
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

export default Packing;
