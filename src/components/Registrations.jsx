import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card.jsx';
import { Button } from '@/components/ui/button.jsx';
import { Badge } from '@/components/ui/badge.jsx';
import { 
  Users, 
  UserPlus, 
  Activity, 
  TrendingUp,
  Crown,
  Star,
  Target,
  Calendar,
  RefreshCw,
  Download,
  UserCheck,
  UserX,
  Hash
} from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { motion } from 'framer-motion';
import ApiService from '../services/apiService';
import DateRangePicker from './ui/date-range-picker.jsx';

function Registrations() {
  const [selectedPeriod, setSelectedPeriod] = useState('30d');
  const [registrationData, setRegistrationData] = useState({
    totalRegistrations: 0,
    uniqueReferralCodes: 0,
    activeDays: 0,
    avgRegistrationsPerDay: 0,
    validSRLinkedRegistrations: 0,
    directRegistrations: 0,
    srLinkedPercentage: 0
  });
  const [trends, setTrends] = useState([]);
  const [sources, setSources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const periods = [
    { label: 'Today', value: 'today' },
    { label: 'This Week', value: '7d' },
    { label: 'This Month', value: '30d' },
    { label: 'All Time', value: 'all' }
  ];

  // Load registration data
  const loadRegistrationData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load each API independently to prevent one failure from breaking everything
      const summary = await ApiService.getRegistrationSummary(selectedPeriod);
      setRegistrationData(summary);

      try {
        const trendsData = await ApiService.getRegistrationTrends(selectedPeriod);
        setTrends(trendsData);
      } catch (trendsErr) {
        console.error('Failed to load trends:', trendsErr);
        setTrends([]);
      }

      try {
        const sourcesData = await ApiService.getRegistrationSources(selectedPeriod);
        setSources(sourcesData);
      } catch (sourcesErr) {
        console.error('Failed to load sources:', sourcesErr);
        setSources([]);
      }
    } catch (err) {
      console.error('Error loading registration data:', err);
      setError('Failed to load registration data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRegistrationData();
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
    total: trend.totalRegistrations,
    srLinked: trend.srLinkedRegistrations,
    direct: trend.directRegistrations,
    fullDate: trend.date
  })).reverse();

  // Prepare pie chart data
  const sourceChartData = sources.map((source, index) => ({
    name: source.source,
    value: source.registrations,
    percentage: source.percentage,
    color: index === 0 ? '#dc2626' : index === 1 ? '#16a34a' : index === 2 ? '#eab308' : '#6b7280'
  }));

  if (loading && trends.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <RefreshCw className="w-16 h-16 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Loading registration data...</p>
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
          <Button onClick={loadRegistrationData} className="bg-red-600 hover:bg-red-700">
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
            <UserPlus className="w-10 h-10 mr-3 text-blue-600" />
            Platform Registrations
          </h1>
          <p className="text-xl text-gray-600">Complete view of all user registrations across the platform</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={loadRegistrationData}
            disabled={loading}
            className="text-gray-600 border-gray-300 hover:border-blue-600"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button
            variant="outline"
            onClick={handleExport}
            className="text-gray-600 border-gray-300 hover:border-blue-600"
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
                  ? 'bg-blue-600 text-white shadow-md'
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
      <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 hover:shadow-lg transition-shadow duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-blue-700">
              Total Platform Registrations
            </CardTitle>
            <Users className="h-6 w-6 text-blue-600" />
          </CardHeader>
          <CardContent>
            <motion.div 
              className="text-3xl font-bold text-blue-800"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.5, type: "spring", stiffness: 200 }}
            >
              {registrationData.totalRegistrations.toLocaleString()}
            </motion.div>
            <p className="text-xs text-blue-600 mt-1 flex items-center">
              <Activity className="w-3 h-3 mr-1" />
              {registrationData.avgRegistrationsPerDay} avg per day
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200 hover:shadow-lg transition-shadow duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-green-700">
              SR-Linked Registrations
            </CardTitle>
            <UserCheck className="h-6 w-6 text-green-600" />
          </CardHeader>
          <CardContent>
            <motion.div 
              className="text-3xl font-bold text-green-800"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.6, type: "spring", stiffness: 200 }}
            >
              {registrationData.validSRLinkedRegistrations.toLocaleString()}
            </motion.div>
            <p className="text-xs text-green-600 mt-1 flex items-center">
              <Target className="w-3 h-3 mr-1" />
              {registrationData.srLinkedPercentage}% of total
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200 hover:shadow-lg transition-shadow duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-purple-700">
              Direct Registrations
            </CardTitle>
            <UserX className="h-6 w-6 text-purple-600" />
          </CardHeader>
          <CardContent>
            <motion.div 
              className="text-3xl font-bold text-purple-800"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.7, type: "spring", stiffness: 200 }}
            >
              {registrationData.directRegistrations.toLocaleString()}
            </motion.div>
            <p className="text-xs text-purple-600 mt-1 flex items-center">
              <UserX className="w-3 h-3 mr-1" />
              {(100 - parseFloat(registrationData.srLinkedPercentage)).toFixed(1)}% of total
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200 hover:shadow-lg transition-shadow duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-orange-700">
              Unique Referral Codes
            </CardTitle>
            <Hash className="h-6 w-6 text-orange-600" />
          </CardHeader>
          <CardContent>
            <motion.div 
              className="text-3xl font-bold text-orange-800"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.8, type: "spring", stiffness: 200 }}
            >
              {registrationData.uniqueReferralCodes}
            </motion.div>
            <p className="text-xs text-orange-600 mt-1 flex items-center">
              <Calendar className="w-3 h-3 mr-1" />
              {registrationData.activeDays} active days
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
              <TrendingUp className="w-5 h-5 mr-2 text-blue-600" />
              Registration Trend
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
                  formatter={(value, name) => [
                    value, 
                    name === 'total' ? 'Total Registrations' :
                    name === 'srLinked' ? 'SR-Linked' : 'Direct'
                  ]}
                />
                <Line 
                  type="monotone" 
                  dataKey="total" 
                  stroke="#2563eb" 
                  strokeWidth={3}
                  dot={{ fill: '#2563eb', strokeWidth: 2, r: 6 }}
                  activeDot={{ r: 8, stroke: '#2563eb', strokeWidth: 2 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="srLinked" 
                  stroke="#16a34a" 
                  strokeWidth={2}
                  dot={{ fill: '#16a34a', strokeWidth: 2, r: 4 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="direct" 
                  stroke="#9333ea" 
                  strokeWidth={2}
                  dot={{ fill: '#9333ea', strokeWidth: 2, r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Registration Sources */}
        <Card className="hover:shadow-lg transition-shadow duration-300">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Users className="w-5 h-5 mr-2 text-purple-600" />
              Registration Sources
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={sourceChartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percentage }) => `${name}: ${percentage}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {sourceChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value, name) => [value.toLocaleString(), 'Registrations']} />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex justify-center mt-4 space-x-4 flex-wrap">
              {sourceChartData.map((entry, index) => (
                <div key={index} className="flex items-center mb-2">
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

      {/* Source Breakdown Table */}
      <motion.div variants={itemVariants}>
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center">
                <Target className="w-5 h-5 mr-2 text-indigo-600" />
                Registration Source Breakdown
              </div>
              <Badge variant="outline" className="text-sm">
                {selectedPeriod === 'all' ? 'All Time' : 
                 selectedPeriod === 'today' ? 'Today' :
                 selectedPeriod === '7d' ? 'Last 7 Days' : 'Last 30 Days'}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {sources.map((source, index) => (
                <motion.div
                  key={index}
                  className={`flex items-center justify-between p-4 rounded-lg border transition-all duration-300 hover:shadow-md ${
                    index === 0 
                      ? 'bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200' 
                      : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                  }`}
                  whileHover={{ scale: 1.02 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="flex items-center">
                    <div className="flex items-center justify-center w-10 h-10 mr-4">
                      {source.source === 'Valid SR' && <Crown className="w-6 h-6 text-green-600" />}
                      {source.source === 'No Referral Code' && <UserX className="w-6 h-6 text-gray-600" />}
                      {source.source === 'Random/Unknown Code' && <Hash className="w-6 h-6 text-orange-600" />}
                      {source.source === 'Invalid/Test SR' && <UserX className="w-6 h-6 text-red-600" />}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{source.source}</h3>
                      <p className="text-sm text-gray-600">{source.percentage}% of total registrations</p>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className={`text-2xl font-bold ${
                      index === 0 ? 'text-blue-600' :
                      index === 1 ? 'text-green-600' :
                      'text-gray-700'
                    }`}>
                      {source.registrations.toLocaleString()}
                    </div>
                    <div className="text-xs text-gray-600">Registrations</div>
                  </div>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}

export default Registrations;