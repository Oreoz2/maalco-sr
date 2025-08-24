import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card.jsx';
import { Button } from '@/components/ui/button.jsx';
import { Badge } from '@/components/ui/badge.jsx';
import { 
  Users, 
  ShoppingCart, 
  DollarSign, 
  TrendingUp, 
  Crown,
  Star,
  Trophy,
  Target,
  Zap,
  Award,
  Medal,
  Sparkles,
  Download,
  RefreshCw
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { motion } from 'framer-motion';
import ApiService from '../services/apiService';
import DateRangePicker from './ui/date-range-picker.jsx';

function Dashboard() {
  const [selectedPeriod, setSelectedPeriod] = useState('7d');
  const [dashboardData, setDashboardData] = useState({
    totalRegistrations: 0,
    totalOrders: 0,
    totalOrderValue: 0,
    averageOrderValue: 0,
    conversionRate: 0
  });
  const [srs, setSRs] = useState([]);
  const [trends, setTrends] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const periods = [
    { label: 'Today', value: 'today' },
    { label: 'This Week', value: '7d' },
    { label: 'This Month', value: '30d' }
  ];

  // Load dashboard data
  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [summary, srsData, trendsData] = await Promise.all([
        ApiService.getDashboardSummary(selectedPeriod),
        ApiService.getSRs(selectedPeriod),
        ApiService.getTrends(selectedPeriod)
      ]);

      setDashboardData(summary);
      setSRs(srsData);
      setTrends(trendsData);
    } catch (err) {
      console.error('Error loading dashboard data:', err);
      setError('Failed to load dashboard data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, [selectedPeriod]);

  // Calculate performance distribution for pie chart
  const performanceData = srs.map((sr, index) => ({
    name: sr.name.split(' ')[0], // First name only
    value: sr.totalCustomersRegistered,
    color: index === 0 ? '#dc2626' : index === 1 ? '#eab308' : '#16a34a'
  }));

  // Get top performers (first 3 from sorted SRs)
  const topPerformers = srs.slice(0, 3);

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

  const getRankBadge = (rank) => {
    const badges = {
      1: { text: "🥇 Champion", className: "bg-gradient-to-r from-yellow-400 to-yellow-600 text-white" },
      2: { text: "🥈 Runner-up", className: "bg-gradient-to-r from-gray-300 to-gray-500 text-white" },
      3: { text: "🥉 Third Place", className: "bg-gradient-to-r from-amber-400 to-amber-600 text-white" }
    };
    return badges[rank] || { text: `#${rank}`, className: "bg-gray-100 text-gray-700" };
  };

  if (loading && srs.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <RefreshCw className="w-16 h-16 animate-spin mx-auto mb-4 text-red-600" />
          <p className="text-gray-600">Loading dashboard data...</p>
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
          <Button onClick={loadDashboardData} className="bg-red-600 hover:bg-red-700">
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
            <Trophy className="w-10 h-10 mr-3 text-yellow-500" />
            Performance Dashboard
          </h1>
          <p className="text-xl text-gray-600">Real-time insights into your SR team performance</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={loadDashboardData}
            disabled={loading}
            className="text-gray-600 border-gray-300 hover:border-red-600"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button
            variant="outline"
            onClick={handleExport}
            className="text-gray-600 border-gray-300 hover:border-red-600"
          >
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </motion.div>

      {/* SR Spotlight Section - Prominent Profile Pictures */}
      <motion.div variants={itemVariants}>
        <Card className="bg-gradient-to-br from-red-50 via-yellow-50 to-green-50 border-2 border-red-200 shadow-xl">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-2xl font-bold text-gray-900 flex items-center justify-center">
              <Sparkles className="w-7 h-7 mr-2 text-yellow-500" />
              Our Star Performers
              <Sparkles className="w-7 h-7 ml-2 text-yellow-500" />
            </CardTitle>
            <p className="text-gray-600">Meet the champions driving Maalco Foods forward</p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {topPerformers.map((sr, index) => {
                const rank = index + 1;
                const badge = getRankBadge(rank);
                
                return (
                  <motion.div
                    key={sr.id}
                    className={`relative p-6 rounded-2xl border-2 transition-all duration-300 hover:scale-105 hover:shadow-2xl ${
                      rank === 1 
                        ? 'bg-gradient-to-br from-yellow-100 to-yellow-200 border-yellow-400 shadow-lg' 
                        : rank === 2
                        ? 'bg-gradient-to-br from-gray-100 to-gray-200 border-gray-400 shadow-md'
                        : 'bg-gradient-to-br from-amber-100 to-amber-200 border-amber-400 shadow-md'
                    }`}
                    whileHover={{ y: -5 }}
                    transition={{ duration: 0.3 }}
                  >
                    {/* Rank Badge */}
                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                      <Badge className={`px-4 py-2 text-sm font-bold ${badge.className} shadow-lg`}>
                        {badge.text}
                      </Badge>
                    </div>

                    {/* Profile Picture */}
                    <div className="flex justify-center mb-4 mt-2">
                      <div className={`relative p-1 rounded-full ${
                        rank === 1 ? 'bg-gradient-to-r from-yellow-400 to-yellow-600' :
                        rank === 2 ? 'bg-gradient-to-r from-gray-400 to-gray-600' :
                        'bg-gradient-to-r from-amber-400 to-amber-600'
                      }`}>
                        <img
                          src={sr.profileImage}
                          alt={sr.name}
                          className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-lg"
                        />
                        {rank === 1 && (
                          <div className="absolute -top-2 -right-2 bg-yellow-500 rounded-full p-2 shadow-lg">
                            <Crown className="w-5 h-5 text-white" />
                          </div>
                        )}
                      </div>
                    </div>

                    {/* SR Info */}
                    <div className="text-center space-y-3">
                      <h3 className="font-bold text-lg text-gray-900">{sr.name}</h3>
                      <div className="flex justify-center">
                        <Badge variant="outline" className="font-mono text-sm">
                          {sr.referralCode}
                        </Badge>
                      </div>
                      
                      {/* Performance Stats */}
                      <div className="grid grid-cols-3 gap-2 text-center">
                        <div className="bg-white/70 rounded-lg p-2">
                          <div className="text-lg font-bold text-red-600">{sr.totalCustomersRegistered}</div>
                          <div className="text-xs text-gray-600">Registrations</div>
                        </div>
                        <div className="bg-white/70 rounded-lg p-2">
                          <div className="text-lg font-bold text-yellow-600">{sr.totalOrders}</div>
                          <div className="text-xs text-gray-600">Orders</div>
                        </div>
                        <div className="bg-white/70 rounded-lg p-2">
                          <div className="text-lg font-bold text-green-600">${sr.totalOrderValue.toFixed(2)}</div>
                          <div className="text-xs text-gray-600">Revenue</div>
                        </div>
                      </div>

                      {/* Achievement Indicator */}
                      <div className="flex justify-center">
                        {rank === 1 && (
                          <Badge className="bg-yellow-500 text-white">
                            <Star className="w-3 h-3 mr-1" />
                            Top Performer
                          </Badge>
                        )}
                        {rank === 2 && (
                          <Badge className="bg-gray-500 text-white">
                            <TrendingUp className="w-3 h-3 mr-1" />
                            Rising Star
                          </Badge>
                        )}
                        {rank === 3 && (
                          <Badge className="bg-amber-500 text-white">
                            <Zap className="w-3 h-3 mr-1" />
                            Consistent
                          </Badge>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </CardContent>
        </Card>
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
                  ? 'bg-red-600 text-white shadow-md'
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
      <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200 hover:shadow-lg transition-shadow duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-red-700">
              Total Customer Registrations
            </CardTitle>
            <Users className="h-6 w-6 text-red-600" />
          </CardHeader>
          <CardContent>
            <motion.div 
              className="text-3xl font-bold text-red-800"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.5, type: "spring", stiffness: 200 }}
            >
              {dashboardData.totalRegistrations}
            </motion.div>
            <p className="text-xs text-red-600 mt-1 flex items-center">
              <TrendingUp className="w-3 h-3 mr-1" />
              {dashboardData.conversionRate}% conversion rate
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200 hover:shadow-lg transition-shadow duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-yellow-700">
              Total Orders from New Customers
            </CardTitle>
            <ShoppingCart className="h-6 w-6 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <motion.div 
              className="text-3xl font-bold text-yellow-800"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.6, type: "spring", stiffness: 200 }}
            >
              {dashboardData.totalOrders}
            </motion.div>
            <p className="text-xs text-yellow-600 mt-1 flex items-center">
              <Target className="w-3 h-3 mr-1" />
              {dashboardData.conversionRate}% conversion rate
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200 hover:shadow-lg transition-shadow duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-green-700">
              Total Order Value Generated
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
              ${dashboardData.totalOrderValue.toFixed(2)}
            </motion.div>
            <p className="text-xs text-green-600 mt-1 flex items-center">
              <DollarSign className="w-3 h-3 mr-1" />
              Average: ${dashboardData.averageOrderValue} per order
            </p>
          </CardContent>
        </Card>
      </motion.div>

      {/* Charts Section */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Registration Trend Chart */}
        <Card className="hover:shadow-lg transition-shadow duration-300">
          <CardHeader>
            <CardTitle className="flex items-center">
              <TrendingUp className="w-5 h-5 mr-2 text-red-600" />
              Registration Trend (Last 7 Days)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={trends}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis 
                  dataKey="date" 
                  tick={{ fontSize: 12 }}
                  tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip 
                  labelFormatter={(value) => new Date(value).toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    month: 'short', 
                    day: 'numeric' 
                  })}
                  formatter={(value) => [value, 'Registrations']}
                />
                <Line 
                  type="monotone" 
                  dataKey="registrations" 
                  stroke="#dc2626" 
                  strokeWidth={3}
                  dot={{ fill: '#dc2626', strokeWidth: 2, r: 6 }}
                  activeDot={{ r: 8, stroke: '#dc2626', strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Performance Distribution */}
        <Card className="hover:shadow-lg transition-shadow duration-300">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Users className="w-5 h-5 mr-2 text-purple-600" />
              SR Performance Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={performanceData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value, percent }) => `${name}: ${(percent * 100).toFixed(1)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {performanceData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [value, 'Registrations']} />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex justify-center mt-4 space-x-4">
              {performanceData.map((entry, index) => (
                <div key={index} className="flex items-center">
                  <div 
                    className="w-3 h-3 rounded-full mr-2" 
                    style={{ backgroundColor: entry.color }}
                  ></div>
                  <span className="text-sm text-gray-600">{entry.name}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}

export default Dashboard;

