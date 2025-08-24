import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card.jsx';
import { Button } from '@/components/ui/button.jsx';
import { Badge } from '@/components/ui/badge.jsx';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select.jsx';
import { 
  Trophy, 
  Crown, 
  Medal, 
  Award,
  Star,
  TrendingUp,
  Users,
  DollarSign,
  ShoppingCart,
  Target,
  Zap,
  Sparkles,
  Filter,
  RefreshCw,
  Download
} from 'lucide-react';
import { motion } from 'framer-motion';
import ApiService from '../services/apiService';

function Leaderboard() {
  const [selectedPeriod, setSelectedPeriod] = useState('7d');
  const [rankingCriteria, setRankingCriteria] = useState('registrations');
  const [srs, setSRs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const periods = [
    { label: 'Daily', value: 'today' },
    { label: 'Weekly', value: '7d' },
    { label: 'Monthly', value: '30d' }
  ];
  
  const rankingOptions = [
    { value: 'registrations', label: 'Customer Registrations', icon: Users },
    { value: 'revenue', label: 'Order Value', icon: DollarSign },
    { value: 'orders', label: 'Number of Orders', icon: ShoppingCart },
    { value: 'conversion', label: 'Conversion Rate', icon: Target }
  ];

  // Load leaderboard data
  const loadLeaderboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      const leaderboard = await ApiService.getLeaderboard(rankingCriteria, selectedPeriod);
      setSRs(leaderboard);
    } catch (err) {
      console.error('Error loading leaderboard:', err);
      setError('Failed to load leaderboard data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLeaderboardData();
  }, [selectedPeriod, rankingCriteria]);

  // Export leaderboard data
  const handleExport = async () => {
    try {
      await ApiService.exportData(selectedPeriod, 'csv');
    } catch (err) {
      console.error('Export failed:', err);
    }
  };

  // SRs are already sorted by the API
  const topThree = srs.slice(0, 3);

  // Get value for display based on criteria
  const getDisplayValue = (sr) => {
    switch (rankingCriteria) {
      case 'registrations':
        return sr.totalCustomersRegistered;
      case 'revenue':
        return `$${sr.totalOrderValue.toFixed(2)}`;
      case 'orders':
        return sr.totalOrders;
      case 'conversion':
        return sr.totalCustomersRegistered > 0 
          ? `${((sr.totalOrders / sr.totalCustomersRegistered) * 100).toFixed(1)}%`
          : '0.0%';
      default:
        return sr.totalCustomersRegistered;
    }
  };

  // Get criteria label
  const getCriteriaLabel = () => {
    const option = rankingOptions.find(opt => opt.value === rankingCriteria);
    return option ? option.label : 'Registrations';
  };

  // Get criteria icon
  const getCriteriaIcon = () => {
    const option = rankingOptions.find(opt => opt.value === rankingCriteria);
    return option ? option.icon : Users;
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

  if (loading && srs.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <RefreshCw className="w-16 h-16 animate-spin mx-auto mb-4 text-yellow-600" />
          <p className="text-gray-600">Loading leaderboard...</p>
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
          <Button onClick={loadLeaderboardData} className="bg-red-600 hover:bg-red-700">
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
            Leaderboard
            <Trophy className="w-10 h-10 ml-3 text-yellow-500" />
          </h1>
          <p className="text-xl text-gray-600">SR performance rankings and achievements</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={loadLeaderboardData}
            disabled={loading}
            className="text-gray-600 border-gray-300 hover:border-yellow-600"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button
            variant="outline"
            onClick={handleExport}
            className="text-gray-600 border-gray-300 hover:border-yellow-600"
          >
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </motion.div>

      {/* Controls */}
      <motion.div variants={itemVariants} className="flex flex-col sm:flex-row justify-center items-center gap-4">
        {/* Period Selector */}
        <div className="flex bg-white rounded-lg border border-gray-200 shadow-sm p-1">
          {periods.map((period) => (
            <Button
              key={period.value}
              variant={selectedPeriod === period.value ? "default" : "ghost"}
              onClick={() => setSelectedPeriod(period.value)}
              className={`px-4 py-2 rounded-md transition-all duration-200 ${
                selectedPeriod === period.value
                  ? 'bg-red-600 text-white shadow-md'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              {period.label}
            </Button>
          ))}
        </div>

        {/* Ranking Criteria Selector */}
        <div className="flex items-center space-x-2">
          <Filter className="w-5 h-5 text-gray-500" />
          <Select value={rankingCriteria} onValueChange={setRankingCriteria}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Select ranking criteria" />
            </SelectTrigger>
            <SelectContent>
              {rankingOptions.map((option) => {
                const IconComponent = option.icon;
                return (
                  <SelectItem key={option.value} value={option.value}>
                    <div className="flex items-center space-x-2">
                      <IconComponent className="w-4 h-4" />
                      <span>{option.label}</span>
                    </div>
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </div>
      </motion.div>

      {/* Top 3 Podium */}
      <motion.div variants={itemVariants}>
        <Card className="bg-gradient-to-br from-yellow-50 via-gray-50 to-amber-50 border-2 border-yellow-200 shadow-xl">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-2xl font-bold text-gray-900 flex items-center justify-center">
              <Sparkles className="w-7 h-7 mr-2 text-yellow-500" />
              Top 3 Champions
              <Sparkles className="w-7 h-7 ml-2 text-yellow-500" />
            </CardTitle>
            <p className="text-gray-600">Ranked by {getCriteriaLabel()}</p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {topThree.map((sr, index) => {
                const rank = index + 1;
                const displayValue = getDisplayValue(sr);
                
                return (
                  <motion.div
                    key={sr.id}
                    className={`relative p-6 rounded-2xl border-2 transition-all duration-300 hover:scale-105 hover:shadow-2xl ${
                      rank === 1 
                        ? 'bg-gradient-to-br from-yellow-100 to-yellow-200 border-yellow-400 shadow-lg order-2 md:order-1' 
                        : rank === 2
                        ? 'bg-gradient-to-br from-gray-100 to-gray-200 border-gray-400 shadow-md order-1 md:order-0'
                        : 'bg-gradient-to-br from-amber-100 to-amber-200 border-amber-400 shadow-md order-3 md:order-2'
                    }`}
                    whileHover={{ y: -5 }}
                    transition={{ duration: 0.3 }}
                  >
                    {/* Rank Badge */}
                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                      <Badge className={`px-4 py-2 text-sm font-bold shadow-lg ${
                        rank === 1 ? 'bg-gradient-to-r from-yellow-400 to-yellow-600 text-white' :
                        rank === 2 ? 'bg-gradient-to-r from-gray-300 to-gray-500 text-white' :
                        'bg-gradient-to-r from-amber-400 to-amber-600 text-white'
                      }`}>
                        {rank === 1 ? '🥇 Champion' : rank === 2 ? '🥈 Runner-up' : '🥉 Third Place'}
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
                          className="w-20 h-20 rounded-full object-cover border-4 border-white shadow-lg"
                        />
                        {rank === 1 && (
                          <div className="absolute -top-2 -right-2 bg-yellow-500 rounded-full p-2 shadow-lg">
                            <Crown className="w-4 h-4 text-white" />
                          </div>
                        )}
                      </div>
                    </div>

                    {/* SR Info */}
                    <div className="text-center space-y-2">
                      <h3 className="font-bold text-lg text-gray-900">{sr.name.split(' ')[0]}</h3>
                      <Badge variant="outline" className="font-mono text-xs">
                        {sr.referralCode}
                      </Badge>
                      
                      {/* Main Metric */}
                      <div className={`text-2xl font-bold ${
                        rank === 1 ? 'text-yellow-700' :
                        rank === 2 ? 'text-gray-700' :
                        'text-amber-700'
                      }`}>
                        {displayValue}
                      </div>
                      <div className="text-sm text-gray-600">{getCriteriaLabel()}</div>

                      {/* Secondary Stats */}
                      <div className="grid grid-cols-3 gap-1 text-xs">
                        <div className="bg-white/70 rounded p-1">
                          <div className="font-semibold text-red-600">{sr.totalCustomersRegistered}</div>
                          <div className="text-gray-600">Reg</div>
                        </div>
                        <div className="bg-white/70 rounded p-1">
                          <div className="font-semibold text-yellow-600">{sr.totalOrders}</div>
                          <div className="text-gray-600">Orders</div>
                        </div>
                        <div className="bg-white/70 rounded p-1">
                          <div className="font-semibold text-green-600">${sr.totalOrderValue.toFixed(0)}</div>
                          <div className="text-gray-600">Revenue</div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Complete Leaderboard */}
      <motion.div variants={itemVariants}>
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center">
                <Trophy className="w-5 h-5 mr-2 text-yellow-600" />
                Complete Rankings
              </div>
              <div className="flex items-center text-sm text-gray-600">
                {React.createElement(getCriteriaIcon(), { className: "w-4 h-4 mr-1" })}
                {getCriteriaLabel()}
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {srs.map((sr, index) => {
                const rank = index + 1;
                const displayValue = getDisplayValue(sr);
                
                return (
                  <motion.div
                    key={sr.id}
                    className={`flex items-center p-4 rounded-lg border transition-all duration-300 hover:shadow-md ${
                      rank <= 3 
                        ? 'bg-gradient-to-r from-yellow-50 to-amber-50 border-yellow-200' 
                        : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                    }`}
                    whileHover={{ scale: 1.02 }}
                    transition={{ duration: 0.2 }}
                  >
                    {/* Rank */}
                    <div className="flex items-center justify-center w-12 h-12 mr-4">
                      {rank === 1 && <Crown className="w-8 h-8 text-yellow-500" />}
                      {rank === 2 && <Medal className="w-8 h-8 text-gray-400" />}
                      {rank === 3 && <Award className="w-8 h-8 text-amber-600" />}
                      {rank > 3 && (
                        <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center text-sm font-bold text-gray-600">
                          {rank}
                        </div>
                      )}
                    </div>

                    {/* Profile Picture */}
                    <div className="mr-4">
                      <img
                        src={sr.profileImage}
                        alt={sr.name}
                        className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-sm"
                      />
                    </div>

                    {/* SR Info */}
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">{sr.name}</h3>
                      <div className="flex items-center space-x-2 text-sm text-gray-600">
                        <Badge variant="outline" className="font-mono text-xs">
                          {sr.referralCode}
                        </Badge>
                      </div>
                    </div>

                    {/* Performance Stats */}
                    <div className="grid grid-cols-4 gap-4 text-center">
                      <div>
                        <div className="text-lg font-bold text-red-600">{sr.totalCustomersRegistered}</div>
                        <div className="text-xs text-gray-600">Registrations</div>
                      </div>
                      <div>
                        <div className="text-lg font-bold text-yellow-600">{sr.totalOrders}</div>
                        <div className="text-xs text-gray-600">Orders</div>
                      </div>
                      <div>
                        <div className="text-lg font-bold text-green-600">${sr.totalOrderValue.toFixed(2)}</div>
                        <div className="text-xs text-gray-600">Revenue</div>
                      </div>
                      <div>
                        <div className="text-lg font-bold text-purple-600">
                          {sr.conversionRate || '0.0'}%
                        </div>
                        <div className="text-xs text-gray-600">Conversion</div>
                      </div>
                    </div>

                    {/* Main Ranking Value */}
                    <div className="ml-4 text-right">
                      <div className={`text-xl font-bold ${
                        rank === 1 ? 'text-yellow-600' :
                        rank === 2 ? 'text-gray-600' :
                        rank === 3 ? 'text-amber-600' :
                        'text-gray-700'
                      }`}>
                        {displayValue}
                      </div>
                      <div className="text-xs text-gray-600">{getCriteriaLabel()}</div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Progress Tracker */}
      <motion.div variants={itemVariants}>
        <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
          <CardHeader>
            <CardTitle className="text-center text-blue-900 flex items-center justify-center">
              <Target className="w-6 h-6 mr-2" />
              Team Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center space-y-4">
              <div className="text-3xl font-bold text-blue-800">
                {Math.round((srs.reduce((sum, sr) => sum + sr.totalCustomersRegistered, 0) / 100) * 100)}%
              </div>
              <p className="text-blue-600">
                Progress towards 100 registrations goal
              </p>
              <div className="w-full bg-blue-200 rounded-full h-4">
                <div 
                  className="bg-gradient-to-r from-blue-500 to-blue-600 h-4 rounded-full transition-all duration-1000"
                  style={{ 
                    width: `${Math.min((srs.reduce((sum, sr) => sum + sr.totalCustomersRegistered, 0) / 100) * 100, 100)}%` 
                  }}
                ></div>
              </div>
              <p className="text-sm text-blue-600">
                🎯 Keep pushing! Every registration counts towards our collective success!
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}

export default Leaderboard;
