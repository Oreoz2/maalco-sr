import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card.jsx';
import { Button } from '@/components/ui/button.jsx';
import { Badge } from '@/components/ui/badge.jsx';
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
  Zap
} from 'lucide-react';
import { motion } from 'framer-motion';
import { getSRById } from '../data/srData';

function SRProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [sr, setSr] = useState(null);
  const [animatedValues, setAnimatedValues] = useState({
    registrations: 0,
    orders: 0,
    orderValue: 0
  });

  useEffect(() => {
    const srData = getSRById(id);
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
  }, [id]);

  if (!sr) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-red-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading SR profile...</p>
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
        <Button
          variant="outline"
          onClick={() => navigate(-1)}
          className="flex items-center space-x-2 text-gray-600 hover:text-red-600 border-gray-300 hover:border-red-600"
        >
          <ArrowLeft size={20} />
          <span>Back</span>
        </Button>
        
        <div className="text-center flex-1 mx-8">
          <h1 className="text-3xl font-bold text-gray-900">SR Profile</h1>
          <p className="text-gray-600">Individual performance and achievements</p>
        </div>
        
        <div className="w-20"></div> {/* Spacer for centering */}
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
              <div className="relative">
                <img
                  src={sr.profileImage}
                  alt={sr.name}
                  className="w-32 h-32 rounded-full object-cover border-4 border-white shadow-lg"
                />
                <div className="absolute -bottom-2 -right-2 bg-green-500 text-white rounded-full p-2">
                  <Star className="w-6 h-6 fill-current" />
                </div>
              </div>

              {/* Profile Info */}
              <div className="flex-1 text-center md:text-left">
                <h2 className="text-3xl font-bold text-gray-900 mb-2">{sr.name}</h2>
                <div className="flex flex-wrap justify-center md:justify-start gap-3 mb-4">
                  <Badge variant="outline" className="bg-red-100 text-red-800 border-red-300">
                    <Phone className="w-3 h-3 mr-1" />
                    Code: {sr.referralCode}
                  </Badge>
                  <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300">
                    <Calendar className="w-3 h-3 mr-1" />
                    {totalDaysActive} Active Days
                  </Badge>
                  <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-300">
                    <Target className="w-3 h-3 mr-1" />
                    {conversionRate}% Conversion
                  </Badge>
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

      {/* Achievements Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 1.0 }}
      >
        <Card className="hover:shadow-lg transition-all duration-300">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Award className="h-5 w-5 mr-2 text-yellow-600" />
              Achievements & Badges
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {sr.achievements.map((achievement, index) => (
                <motion.div
                  key={index}
                  whileHover={{ scale: 1.05 }}
                  className="flex items-center space-x-3 p-4 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg border border-yellow-200"
                >
                  <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center">
                    <Trophy className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">{achievement}</h4>
                    <p className="text-sm text-gray-600">Earned recently</p>
                  </div>
                </motion.div>
              ))}
              
              {/* Placeholder for more achievements */}
              <motion.div
                whileHover={{ scale: 1.05 }}
                className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg border border-gray-200 opacity-60"
              >
                <div className="w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center">
                  <Star className="w-6 h-6 text-gray-500" />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-500">More achievements coming...</h4>
                  <p className="text-sm text-gray-400">Keep performing!</p>
                </div>
              </motion.div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}

export default SRProfile;

