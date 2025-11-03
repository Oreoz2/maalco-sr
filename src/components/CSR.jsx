import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Headphones, Trophy, DollarSign, TrendingUp, Phone } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import ApiService from '../services/apiService';
import DateRangePicker from './ui/date-range-picker.jsx';

const CSR = () => {
  const [csrStaff, setCsrStaff] = useState([]);
  const [trends, setTrends] = useState([]);
  const [dateRange, setDateRange] = useState('30d');
  const [loading, setLoading] = useState(true);
  const [uploadingCsrId, setUploadingCsrId] = useState(null);
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
      const [csrData, trendsData] = await Promise.all([
        ApiService.getCSRStaff(dateRange),
        ApiService.getCSRTrends(dateRange)
      ]);
      setCsrStaff(csrData);
      setTrends(trendsData);
    } catch (error) {
      console.error('Error fetching CSR data:', error);
    }
    setLoading(false);
  };

  const handleImageUpload = async (event, csrId) => {
    const file = event.target.files[0];
    if (!file) return;

    setUploadingCsrId(csrId);
    try {
      await ApiService.uploadCSRImage(csrId, file);
      await fetchData(); // Refresh CSR data to show new image
    } catch (error) {
      console.error('Error uploading CSR image:', error);
      alert('Failed to upload image. Please try again.');
    } finally {
      setUploadingCsrId(null);
    }
  };

  // Calculate summary metrics
  const totalInteractions = csrStaff.reduce((sum, c) => sum + c.totalInteractions, 0);
  const totalSuccessfulOrders = csrStaff.reduce((sum, c) => sum + c.successfulOrders, 0);
  const totalOrderValue = csrStaff.reduce((sum, c) => sum + c.totalOrderValue, 0);
  const avgSuccessRate = csrStaff.length > 0
    ? (csrStaff.reduce((sum, c) => sum + parseFloat(c.successRate), 0) / csrStaff.length).toFixed(1)
    : 0;

  // Format trends for chart
  const chartData = trends.reduce((acc, item) => {
    const date = new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const existing = acc.find(d => d.date === date);
    if (existing) {
      existing[item.csrName] = (existing[item.csrName] || 0) + item.interactions;
    } else {
      acc.push({ date, [item.csrName]: item.interactions });
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
          <Headphones className="h-12 w-12 animate-bounce mx-auto text-purple-600" />
          <p className="mt-4 text-lg text-gray-600">Loading CSR data...</p>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-purple-50 p-6"
    >
      {/* Header */}
      <motion.div variants={itemVariants} className="mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-purple-100 rounded-lg">
              <Headphones className="h-8 w-8 text-purple-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">CSR Dashboard</h1>
              <p className="text-gray-600">Monitor customer service performance and interactions</p>
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
                  ? 'bg-green-600 text-white shadow-md'
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
        <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-medium flex items-center gap-2">
              <Phone className="h-5 w-5" />
              Total Interactions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{totalInteractions}</div>
            <p className="text-purple-100 text-sm mt-1">Customer calls handled</p>
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
            <p className="text-green-100 text-sm mt-1">{totalSuccessfulOrders} successful orders</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-yellow-500 to-yellow-600 text-white">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-medium flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Order Value
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">${totalOrderValue.toFixed(2)}</div>
            <p className="text-yellow-100 text-sm mt-1">Generated from calls</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-indigo-500 to-indigo-600 text-white">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-medium flex items-center gap-2">
              <Headphones className="h-5 w-5" />
              Active CSR
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{csrStaff.length}</div>
            <p className="text-indigo-100 text-sm mt-1">On service duty</p>
          </CardContent>
        </Card>
      </motion.div>

      {/* Performance Trends Chart */}
      <motion.div variants={itemVariants} className="mb-8">
        <Card>
          <CardHeader>
            <CardTitle>Interaction Trends</CardTitle>
            <CardDescription>Daily customer interactions per CSR over time</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                {csrStaff.map((csr, index) => (
                  <Line
                    key={csr.id}
                    type="monotone"
                    dataKey={csr.name}
                    stroke={`hsl(${270 + index * 45}, 70%, 50%)`}
                    strokeWidth={2}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </motion.div>

      {/* CSR Staff Grid */}
      <motion.div variants={itemVariants}>
        <h2 className="text-2xl font-bold mb-4 text-gray-900">CSR Performance</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {csrStaff.map((csr) => (
            <motion.div
              key={csr.id}
              variants={itemVariants}
              whileHover={{ scale: 1.02 }}
              className="relative"
            >
              <Card className="h-full hover:shadow-xl transition-shadow">
                <CardHeader className="pb-4">
                  <div className="flex items-start gap-4">
                    <div className="relative">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleImageUpload(e, csr.id)}
                        style={{ display: 'none' }}
                        ref={(el) => (fileInputRefs.current[csr.id] = el)}
                      />
                      <img
                        src={csr.profileImage}
                        alt={csr.name}
                        onClick={() => fileInputRefs.current[csr.id]?.click()}
                        className="w-20 h-20 rounded-full object-cover border-4 border-purple-200 shadow-lg cursor-pointer hover:opacity-80 transition-opacity"
                        title="Click to upload new image"
                      />
                      {uploadingCsrId === csr.id && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-full">
                          <span className="text-white text-xs">Uploading...</span>
                        </div>
                      )}
                      <Badge className="absolute -bottom-1 -right-1 bg-green-500">
                        Active
                      </Badge>
                    </div>
                    <div className="flex-1">
                      <CardTitle className="text-xl">{csr.name}</CardTitle>
                      <CardDescription>{csr.email}</CardDescription>
                      <div className="mt-2 flex gap-2">
                        <Badge variant="outline" className="text-xs">
                          Success: {csr.successRate}%
                        </Badge>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-3">
                      <div>
                        <div className="text-sm text-gray-600">Total Interactions</div>
                        <div className="text-2xl font-bold text-purple-600">{csr.totalInteractions}</div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-600">New Orders</div>
                        <div className="text-lg font-semibold text-blue-600">{csr.newOrderCalls}</div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-600">Complaints</div>
                        <div className="text-lg font-semibold text-red-600">{csr.complaintCalls}</div>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div>
                        <div className="text-sm text-gray-600">Successful Orders</div>
                        <div className="text-2xl font-bold text-green-600">{csr.successfulOrders}</div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-600">Registrations</div>
                        <div className="text-lg font-semibold text-indigo-600">{csr.successfulRegistrations}</div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-600">Resolved</div>
                        <div className="text-lg font-semibold text-green-600">{csr.complaintsResolved}</div>
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 pt-4 border-t">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Order Value Generated</span>
                      <span className="text-xl font-bold text-yellow-600">${csr.totalOrderValue.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center mt-2">
                      <span className="text-sm text-gray-600">Avg Call Duration</span>
                      <span className="text-lg font-semibold text-gray-700">{csr.avgCallDuration.toFixed(0)}s</span>
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

export default CSR;
