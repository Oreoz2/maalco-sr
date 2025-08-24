import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card.jsx';
import { Button } from '@/components/ui/button.jsx';
import { 
  LineChart, 
  Line, 
  BarChart,
  Bar,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import { 
  Users, 
  ShoppingCart, 
  DollarSign, 
  TrendingUp,
  ArrowLeft,
  Award,
  Target,
  Calendar,
  Phone,
  Star,
  Trophy,
  Zap,
  RefreshCw,
  Download,
  Upload,
} from 'lucide-react';
import { motion } from 'framer-motion';
import ApiService from '../services/apiService';

function SRProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [sr, setSr] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dateRange, setDateRange] = useState('30d');
  const [uploading, setUploading] = useState(false);
  const [animatedValues, setAnimatedValues] = useState({
    registrations: 0,
    orders: 0,
    orderValue: 0
  });

  const loadSRData = async () => {
    try {
      setLoading(true);
      setError(null);
      const srData = await ApiService.getSRById(id, dateRange);
      
      if (srData) {
        setSr(srData);
        
        // Animate numbers
        const animateValue = (start, end, duration, callback) => {
          const startTime = Date.now();
          const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const current = Math.floor(start + (end - start) * progress);
            callback(current);
            if (progress < 1) {
              requestAnimationFrame(animate);
            }
          };
          animate();
        };

        animateValue(0, srData.totalCustomersRegistered, 1500, (value) => 
          setAnimatedValues(prev => ({ ...prev, registrations: value }))
        );
        animateValue(0, srData.totalOrders, 1200, (value) => 
          setAnimatedValues(prev => ({ ...prev, orders: value }))
        );
        animateValue(0, srData.totalOrderValue, 1800, (value) => 
          setAnimatedValues(prev => ({ ...prev, orderValue: value }))
        );
      }
    } catch (err) {
      setError('Failed to load SR data. Please try again.');
      console.error('Error loading SR data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      loadSRData();
    }
  }, [id, dateRange]);

  const handleImageUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    try {
      setUploading(true);
      const result = await ApiService.uploadSRImage(id, file);
      // Refresh SR data to get updated image URL
      await loadSRData();
    } catch (err) {
      setError('Failed to upload image. Please try again.');
      console.error('Error uploading image:', err);
    } finally {
      setUploading(false);
    }
  };


  const handleExport = async () => {
    try {
      await ApiService.exportData(dateRange, 'csv');
    } catch (err) {
      setError('Failed to export data. Please try again.');
      console.error('Error exporting data:', err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-red-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading SR profile...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="text-red-600 mb-4">
            <Trophy className="w-16 h-16 mx-auto mb-2" />
            <p className="text-lg font-semibold">{error}</p>
          </div>
          <Button onClick={loadSRData} className="bg-red-600 hover:bg-red-700">
            <RefreshCw className="w-4 h-4 mr-2" />
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  if (!sr) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="text-gray-600 mb-4">
            <Trophy className="w-16 h-16 mx-auto mb-2" />
            <p className="text-lg font-semibold">SR not found</p>
          </div>
          <Button onClick={() => navigate(-1)} variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  // Prepare chart data
  const performanceData = sr.dailyData.map(day => ({
    date: new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    registrations: day.registrations,
    orders: day.orders,
    orderValue: day.orderValue
  })).reverse();

  // Calculate performance metrics
  const conversionRate = sr.totalCustomersRegistered > 0 
    ? ((sr.totalOrders / sr.totalCustomersRegistered) * 100).toFixed(1)
    : 0;
  
  const avgOrderValue = sr.totalOrders > 0 
    ? (sr.totalOrderValue / sr.totalOrders).toFixed(2)
    : 0;

  const totalDaysActive = sr.dailyData.filter(day => day.registrations > 0).length;

  return (
    <div className="space-y-8">
      {/* Header with Back Button */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="flex items-center justify-between"
      >
        <div className="flex space-x-2">
          <Button
            variant="outline"
            onClick={() => navigate(-1)}
            className="flex items-center space-x-2 text-gray-600 hover:text-red-600 border-gray-300 hover:border-red-600"
          >
            <ArrowLeft size={20} />
            <span>Back</span>
          </Button>
          
          <Button
            variant="outline"
            onClick={loadSRData}
            disabled={loading}
            className="flex items-center space-x-2"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </Button>
          
          <Button
            variant="outline"
            onClick={handleExport}
            className="flex items-center space-x-2"
          >
            <Download className="w-4 h-4" />
            <span>Export</span>
          </Button>
        </div>
        
        <div className="text-center flex-1 mx-8">
          <h1 className="text-3xl font-bold text-gray-900">SR Profile</h1>
          <p className="text-gray-600">Individual performance and achievements</p>
        </div>
        
        {/* Date Range Selector */}
        <div className="flex space-x-2">
          <select 
            value={dateRange} 
            onChange={(e) => setDateRange(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
          >
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
            <option value="90d">Last 90 Days</option>
            <option value="all">All Time</option>
          </select>
        </div>
      </motion.div>

      {/* SR Profile Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
      >
        <Card className="bg-gradient-to-r from-red-50 via-yellow-50 to-green-50 border-2 border-gray-200 hover:shadow-xl transition-all duration-300">
          <CardContent className="p-8">
            <div className="flex flex-col md:flex-row items-center space-y-6 md:space-y-0 md:space-x-8">
              {/* Profile Image */}
              <div className="relative group">
                <img
                  src={sr.profileImage}
                  alt={sr.name}
                  className="w-32 h-32 rounded-full object-cover border-4 border-white shadow-lg"
                />
                <div className="absolute -bottom-2 -right-2 bg-green-500 text-white rounded-full p-2">
                  <Star className="w-6 h-6 fill-current" />
                </div>
                
                {/* Image Upload Overlay */}
                <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center cursor-pointer">
                  <label htmlFor="image-upload" className="cursor-pointer">
                    {uploading ? (
                      <RefreshCw className="w-8 h-8 text-white animate-spin" />
                    ) : (
                      <Upload className="w-8 h-8 text-white" />
                    )}
                  </label>
                  <input
                    id="image-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    disabled={uploading}
                    className="hidden"
                  />
                </div>
                
              </div>

              {/* Profile Info */}
              <div className="flex-1 text-center md:text-left">
                <h2 className="text-3xl font-bold text-gray-900 mb-2">{sr.name}</h2>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
                  <div className="bg-red-50 p-3 rounded-lg border border-red-200">
                    <div className="flex items-center text-red-700 text-sm font-medium">
                      <Phone className="w-4 h-4 mr-2" />
                      Referral Code
                    </div>
                    <div className="text-red-900 font-semibold mt-1">{sr.referralCode}</div>
                  </div>
                  <div className="bg-green-50 p-3 rounded-lg border border-green-200">
                    <div className="flex items-center text-green-700 text-sm font-medium">
                      <Calendar className="w-4 h-4 mr-2" />
                      Active Days
                    </div>
                    <div className="text-green-900 font-semibold mt-1">{totalDaysActive} days</div>
                  </div>
                  <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-200">
                    <div className="flex items-center text-yellow-700 text-sm font-medium">
                      <Target className="w-4 h-4 mr-2" />
                      Conversion Rate
                    </div>
                    <div className="text-yellow-900 font-semibold mt-1">{conversionRate}%</div>
                  </div>
                </div>
                
                {/* Quick Stats */}
                <div className="grid grid-cols-3 gap-4 mt-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-600">{animatedValues.registrations}</div>
                    <div className="text-sm text-gray-600">Registrations</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-yellow-600">{animatedValues.orders}</div>
                    <div className="text-sm text-gray-600">Orders</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">${animatedValues.orderValue.toFixed(2)}</div>
                    <div className="text-sm text-gray-600">Revenue</div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Performance Metrics Cards */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.4 }}
        className="grid grid-cols-1 md:grid-cols-4 gap-6"
      >
        <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200 hover:shadow-lg transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-red-700">
              Customer Registrations
            </CardTitle>
            <Users className="h-5 w-5 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-800">{sr.totalCustomersRegistered}</div>
            <p className="text-xs text-red-600 mt-1">Total acquired customers</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200 hover:shadow-lg transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-yellow-700">
              Orders Generated
            </CardTitle>
            <ShoppingCart className="h-5 w-5 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-800">{sr.totalOrders}</div>
            <p className="text-xs text-yellow-600 mt-1">{conversionRate}% conversion rate</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200 hover:shadow-lg transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-green-700">
              Revenue Generated
            </CardTitle>
            <DollarSign className="h-5 w-5 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-800">${sr.totalOrderValue.toFixed(2)}</div>
            <p className="text-xs text-green-600 mt-1">Avg: ${avgOrderValue} per order</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200 hover:shadow-lg transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-purple-700">
              Performance Score
            </CardTitle>
            <Zap className="h-5 w-5 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-800">
              {Math.round((sr.totalCustomersRegistered * 2 + sr.totalOrders * 5 + sr.totalOrderValue) / 10)}
            </div>
            <p className="text-xs text-purple-600 mt-1">Composite score</p>
          </CardContent>
        </Card>
      </motion.div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Daily Registrations Trend */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
        >
          <Card className="hover:shadow-lg transition-all duration-300">
            <CardHeader>
              <CardTitle className="flex items-center">
                <TrendingUp className="h-5 w-5 mr-2 text-blue-600" />
                Daily Registration Performance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={performanceData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="date" stroke="#666" />
                  <YAxis stroke="#666" />
                  <Tooltip />
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
        </motion.div>

        {/* Daily Revenue Performance */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.8 }}
        >
          <Card className="hover:shadow-lg transition-all duration-300">
            <CardHeader>
              <CardTitle className="flex items-center">
                <DollarSign className="h-5 w-5 mr-2 text-green-600" />
                Daily Revenue Performance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={performanceData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="date" stroke="#666" />
                  <YAxis stroke="#666" />
                  <Tooltip formatter={(value) => [`$${value.toFixed(2)}`, 'Revenue']} />
                  <Bar 
                    dataKey="orderValue" 
                    fill="#16a34a"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Performance Insights Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 1.0 }}
      >
        <Card className="hover:shadow-lg transition-all duration-300">
          <CardHeader>
            <CardTitle className="flex items-center">
              <TrendingUp className="h-5 w-5 mr-2 text-blue-600" />
              Performance Insights
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Recent Activity Timeline */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                  <Calendar className="w-5 h-5 mr-2 text-gray-600" />
                  Recent Activity Timeline
                </h3>
                <div className="space-y-3">
                  {sr.dailyData.slice(-5).reverse().map((day, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                        <span className="text-sm font-medium text-gray-700">
                          {new Date(day.date).toLocaleDateString('en-US', { 
                            month: 'short', 
                            day: 'numeric' 
                          })}
                        </span>
                      </div>
                      <div className="flex space-x-4 text-sm">
                        <span className="text-red-600 font-medium">{day.registrations} reg</span>
                        <span className="text-yellow-600 font-medium">{day.orders} ord</span>
                        <span className="text-green-600 font-medium">${day.orderValue}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Performance Analysis */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                  <Award className="w-5 h-5 mr-2 text-gray-600" />
                  Performance Analysis
                </h3>
                <div className="space-y-3">
                  {/* Conversion Quality */}
                  <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-green-700">Conversion Quality</span>
                      <Target className="w-4 h-4 text-green-600" />
                    </div>
                    <div className="text-lg font-bold text-green-800">{conversionRate}%</div>
                    <p className="text-xs text-green-600 mt-1">
                      {parseFloat(conversionRate) >= 30 ? 'Excellent conversion rate' : 
                       parseFloat(conversionRate) >= 20 ? 'Good conversion performance' :
                       parseFloat(conversionRate) >= 10 ? 'Moderate conversion rate' :
                       'Focus on improving conversion'}
                    </p>
                  </div>

                  {/* Revenue Efficiency */}
                  <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-blue-700">Revenue Efficiency</span>
                      <DollarSign className="w-4 h-4 text-blue-600" />
                    </div>
                    <div className="text-lg font-bold text-blue-800">${avgOrderValue}</div>
                    <p className="text-xs text-blue-600 mt-1">Average order value</p>
                  </div>

                  {/* Activity Consistency */}
                  <div className="p-4 bg-gradient-to-r from-purple-50 to-violet-50 rounded-lg border border-purple-200">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-purple-700">Activity Consistency</span>
                      <Zap className="w-4 h-4 text-purple-600" />
                    </div>
                    <div className="text-lg font-bold text-purple-800">
                      {Math.round((totalDaysActive / Math.max(sr.dailyData.length, 1)) * 100)}%
                    </div>
                    <p className="text-xs text-purple-600 mt-1">{totalDaysActive} of {sr.dailyData.length} days active</p>
                  </div>

                  {/* Performance Status */}
                  <div className="p-4 bg-gradient-to-r from-orange-50 to-amber-50 rounded-lg border border-orange-200">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-orange-700">Performance Level</span>
                      <Trophy className="w-4 h-4 text-orange-600" />
                    </div>
                    <div className="text-lg font-bold text-orange-800">
                      {sr.totalCustomersRegistered >= 80 ? 'Elite' :
                       sr.totalCustomersRegistered >= 50 ? 'Advanced' :
                       sr.totalCustomersRegistered >= 25 ? 'Intermediate' :
                       sr.totalCustomersRegistered >= 10 ? 'Developing' : 'New'}
                    </div>
                    <p className="text-xs text-orange-600 mt-1">
                      {sr.totalCustomersRegistered >= 80 ? 'Top tier performer' :
                       sr.totalCustomersRegistered >= 50 ? 'Strong performance' :
                       sr.totalCustomersRegistered >= 25 ? 'Good progress' :
                       sr.totalCustomersRegistered >= 10 ? 'Building momentum' : 'Getting started'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}

export default SRProfile;

