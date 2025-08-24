import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card.jsx';
import { Button } from '@/components/ui/button.jsx';
import { 
  LineChart, 
  Line, 
  PieChart, 
  Pie, 
  Cell, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend,
  ResponsiveContainer 
} from 'recharts';
import { 
  Users, 
  ShoppingCart, 
  DollarSign, 
  TrendingUp,
  Calendar,
  Trophy,
  Star
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { srs, getTotalRegistrations, getTotalOrders, getTotalOrderValue, getTopPerformers, getRegistrationTrend } from '../data/srData';

function Dashboard() {
  const [selectedPeriod, setSelectedPeriod] = useState('This Week');
  const [animatedValues, setAnimatedValues] = useState({
    registrations: 0,
    orders: 0,
    orderValue: 0
  });

  const periods = ['Today', 'This Week', 'This Month'];
  
  // Get current metrics
  const totalRegistrations = getTotalRegistrations();
  const totalOrders = getTotalOrders();
  const totalOrderValue = getTotalOrderValue();
  const topPerformers = getTopPerformers(3);
  const registrationTrend = getRegistrationTrend(7);

  // Animate numbers on load
  useEffect(() => {
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

    animateValue(0, totalRegistrations, 1500, (value) => 
      setAnimatedValues(prev => ({ ...prev, registrations: value }))
    );
    animateValue(0, totalOrders, 1200, (value) => 
      setAnimatedValues(prev => ({ ...prev, orders: value }))
    );
    animateValue(0, totalOrderValue, 1800, (value) => 
      setAnimatedValues(prev => ({ ...prev, orderValue: value }))
    );
  }, [totalRegistrations, totalOrders, totalOrderValue]);

  // Prepare pie chart data
  const pieData = srs.map((sr, index) => ({
    name: sr.name.split(' ')[0], // First name only for chart
    value: sr.totalCustomersRegistered,
    percentage: ((sr.totalCustomersRegistered / totalRegistrations) * 100).toFixed(1),
    color: ['#dc2626', '#eab308', '#16a34a'][index]
  }));

  const COLORS = ['#dc2626', '#eab308', '#16a34a'];

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center"
      >
        <h1 className="text-4xl font-bold text-gray-900 mb-2">
          Performance Dashboard
        </h1>
        <p className="text-gray-600 text-lg">
          Real-time insights into your SR team performance
        </p>
      </motion.div>

      {/* Period Selector */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="flex justify-center"
      >
        <div className="bg-white rounded-lg p-1 shadow-md border">
          {periods.map((period) => (
            <Button
              key={period}
              variant={selectedPeriod === period ? "default" : "ghost"}
              onClick={() => setSelectedPeriod(period)}
              className={`mx-1 ${
                selectedPeriod === period 
                  ? 'bg-red-600 text-white shadow-lg' 
                  : 'text-gray-700 hover:bg-red-50 hover:text-red-600'
              }`}
            >
              <Calendar className="w-4 h-4 mr-2" />
              {period}
            </Button>
          ))}
        </div>
      </motion.div>

      {/* Key Metrics Cards */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.4 }}
        className="grid grid-cols-1 md:grid-cols-3 gap-6"
      >
        <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200 hover:shadow-lg transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-red-700">
              Total Customer Registrations
            </CardTitle>
            <Users className="h-6 w-6 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-800">
              {animatedValues.registrations}
            </div>
            <div className="flex items-center mt-2">
              <TrendingUp className="h-4 w-4 text-green-600 mr-1" />
              <span className="text-sm text-green-600 font-medium">
                +12% from last week
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200 hover:shadow-lg transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-yellow-700">
              Total Orders from New Customers
            </CardTitle>
            <ShoppingCart className="h-6 w-6 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-yellow-800">
              {animatedValues.orders}
            </div>
            <div className="flex items-center mt-2">
              <TrendingUp className="h-4 w-4 text-green-600 mr-1" />
              <span className="text-sm text-green-600 font-medium">
                +25% conversion rate
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200 hover:shadow-lg transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-green-700">
              Total Order Value Generated
            </CardTitle>
            <DollarSign className="h-6 w-6 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-800">
              ${animatedValues.orderValue.toFixed(2)}
            </div>
            <div className="flex items-center mt-2">
              <TrendingUp className="h-4 w-4 text-green-600 mr-1" />
              <span className="text-sm text-green-600 font-medium">
                Average: ${(totalOrderValue / totalOrders).toFixed(2)} per order
              </span>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Registration Trend Chart */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
        >
          <Card className="hover:shadow-lg transition-all duration-300">
            <CardHeader>
              <CardTitle className="flex items-center">
                <TrendingUp className="h-5 w-5 mr-2 text-blue-600" />
                Registration Trend (Last 7 Days)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={registrationTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis 
                    dataKey="date" 
                    tickFormatter={(date) => new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    stroke="#666"
                  />
                  <YAxis stroke="#666" />
                  <Tooltip 
                    labelFormatter={(date) => new Date(date).toLocaleDateString()}
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
        </motion.div>

        {/* SR Performance Distribution */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.8 }}
        >
          <Card className="hover:shadow-lg transition-all duration-300">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Users className="h-5 w-5 mr-2 text-purple-600" />
                SR Performance Distribution
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percentage }) => `${name}: ${percentage}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value, name) => [value, 'Registrations']} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Top Performers Snapshot */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 1.0 }}
      >
        <Card className="hover:shadow-lg transition-all duration-300">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center">
                <Trophy className="h-5 w-5 mr-2 text-yellow-600" />
                Top Performers
              </div>
              <Link to="/leaderboard">
                <Button variant="outline" size="sm" className="text-red-600 border-red-600 hover:bg-red-50">
                  View Full Leaderboard
                </Button>
              </Link>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {topPerformers.map((sr, index) => (
                <Link key={sr.id} to={`/sr/${sr.id}`}>
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className={`p-4 rounded-lg border-2 cursor-pointer transition-all duration-300 ${
                      index === 0 
                        ? 'border-yellow-400 bg-gradient-to-br from-yellow-50 to-yellow-100' 
                        : index === 1
                        ? 'border-gray-400 bg-gradient-to-br from-gray-50 to-gray-100'
                        : 'border-orange-400 bg-gradient-to-br from-orange-50 to-orange-100'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="relative">
                        <img
                          src={sr.profileImage}
                          alt={sr.name}
                          className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-md"
                        />
                        <div className={`absolute -top-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white ${
                          index === 0 ? 'bg-yellow-500' : index === 1 ? 'bg-gray-500' : 'bg-orange-500'
                        }`}>
                          {index + 1}
                        </div>
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 text-sm">
                          {sr.name.split(' ')[0]} {sr.name.split(' ')[1]}
                        </h3>
                        <div className="flex items-center space-x-4 text-xs text-gray-600 mt-1">
                          <span className="flex items-center">
                            <Users className="w-3 h-3 mr-1" />
                            {sr.totalCustomersRegistered}
                          </span>
                          <span className="flex items-center">
                            <ShoppingCart className="w-3 h-3 mr-1" />
                            {sr.totalOrders}
                          </span>
                          <span className="flex items-center">
                            <DollarSign className="w-3 h-3 mr-1" />
                            ${sr.totalOrderValue.toFixed(2)}
                          </span>
                        </div>
                      </div>
                      {index === 0 && (
                        <Star className="w-5 h-5 text-yellow-500 fill-current" />
                      )}
                    </div>
                  </motion.div>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}

export default Dashboard;

