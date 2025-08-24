import { BrowserRouter as Router, Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button.jsx';
import { Card } from '@/components/ui/card.jsx';
import { 
  Home, 
  Trophy, 
  Users, 
  Menu,
  X,
  RefreshCw,
  UserPlus,
  ShoppingCart,
  LogOut
} from 'lucide-react';
import './App.css';
import ApiService from './services/apiService';
import MaalcoLogo from './assets/maalco-logo.jpg';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import LoginModal from './components/LoginModal';

// Import components (we'll create these)
import Dashboard from './components/Dashboard';
import Leaderboard from './components/Leaderboard';
import SRProfile from './components/SRProfile';
import Registrations from './components/Registrations';
import Sales from './components/Sales';

function Navigation() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();
  const { logout } = useAuth();

  const navItems = [
    { path: '/', icon: Home, label: 'Dashboard' },
    { path: '/registrations', icon: UserPlus, label: 'Registrations' },
    { path: '/sales', icon: ShoppingCart, label: 'Sales' },
    { path: '/leaderboard', icon: Trophy, label: 'Leaderboard' },
    { path: '/srs', icon: Users, label: 'SRs' },
  ];

  return (
    <nav className="bg-white shadow-lg border-b-4 border-red-600">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo and Brand */}
          <div className="flex items-center flex-shrink-0">
            <Link to="/" className="flex items-center space-x-2 sm:space-x-3">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg overflow-hidden shadow-md flex-shrink-0">
                <img 
                  src={MaalcoLogo} 
                  alt="Maalco Foods Logo" 
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="min-w-0">
                <h1 className="text-lg sm:text-xl font-bold text-gray-900 truncate">Maalco Foods</h1>
                <p className="text-xs sm:text-sm text-gray-600 truncate">SR Performance</p>
              </div>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center space-x-4 flex-shrink-0">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-200 ${
                    isActive
                      ? 'bg-red-600 text-white shadow-lg'
                      : 'text-gray-700 hover:bg-red-50 hover:text-red-600'
                  }`}
                >
                  <Icon size={20} />
                  <span className="font-medium">{item.label}</span>
                </Link>
              );
            })}
            
            {/* Logout Button */}
            <Button
              onClick={logout}
              variant="outline"
              className="flex items-center space-x-2 text-gray-700 hover:text-red-600 border-gray-300 hover:border-red-600"
            >
              <LogOut size={20} />
              <span className="font-medium">Logout</span>
            </Button>
          </div>

          {/* Tablet Navigation - Compact Icons Only */}
          <div className="hidden md:flex lg:hidden items-center space-x-2 flex-shrink-0">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  title={item.label}
                  className={`flex items-center justify-center p-2 rounded-lg transition-all duration-200 ${
                    isActive
                      ? 'bg-red-600 text-white shadow-lg'
                      : 'text-gray-700 hover:bg-red-50 hover:text-red-600'
                  }`}
                >
                  <Icon size={20} />
                </Link>
              );
            })}
            
            {/* Tablet Logout Button - Icon Only */}
            <Button
              onClick={logout}
              variant="outline"
              size="sm"
              title="Logout"
              className="p-2 text-gray-700 hover:text-red-600 border-gray-300 hover:border-red-600 flex-shrink-0"
            >
              <LogOut size={20} />
            </Button>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-gray-700"
            >
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-gray-200">
            <div className="space-y-2">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setIsMenuOpen(false)}
                    className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                      isActive
                        ? 'bg-red-600 text-white'
                        : 'text-gray-700 hover:bg-red-50 hover:text-red-600'
                    }`}
                  >
                    <Icon size={20} />
                    <span className="font-medium">{item.label}</span>
                  </Link>
                );
              })}
              
              {/* Mobile Logout Button */}
              <button
                onClick={() => {
                  logout();
                  setIsMenuOpen(false);
                }}
                className="flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 text-gray-700 hover:bg-red-50 hover:text-red-600 w-full"
              >
                <LogOut size={20} />
                <span className="font-medium">Logout</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}

// Protected Route component
function ProtectedRoute({ children }) {
  const { isAuthenticated, isLoading } = useAuth();
  
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-16 h-16 mx-auto mb-4 animate-spin text-red-600" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }
  
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 relative">
        {/* Show blurred dashboard in background */}
        <div className="absolute inset-0 pointer-events-none">
          <Navigation />
          <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <Dashboard />
          </main>
        </div>
        
        {/* Login Modal */}
        <LoginModal />
      </div>
    );
  }
  
  return children;
}

// Main App component
function AppContent() {
  return (
    <div className="min-h-screen bg-gray-50">
      <ProtectedRoute>
        <Navigation />
        
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/registrations" element={<Registrations />} />
            <Route path="/sales" element={<Sales />} />
            <Route path="/leaderboard" element={<Leaderboard />} />
            <Route path="/sr/:id" element={<SRProfile />} />
            <Route path="/srs" element={<SRsList />} />
            {/* Redirect any other path to dashboard */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </ProtectedRoute>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppContent />
      </Router>
    </AuthProvider>
  );
}

// Simple SRs list component
function SRsList() {
  const [srs, setSrs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadSRs = async () => {
    try {
      setLoading(true);
      setError(null);
      const srsData = await ApiService.getSRs('all');
      setSrs(srsData);
    } catch (err) {
      setError('Failed to load SRs. Please try again.');
      console.error('Error loading SRs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSRs();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <RefreshCw className="w-16 h-16 mx-auto mb-4 animate-spin text-red-600" />
          <p className="text-gray-600">Loading Senior Representatives...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="text-red-600 mb-4">
            <Users className="w-16 h-16 mx-auto mb-2" />
            <p className="text-lg font-semibold">{error}</p>
          </div>
          <Button onClick={loadSRs} className="bg-red-600 hover:bg-red-700">
            <RefreshCw className="w-4 h-4 mr-2" />
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="text-center flex-1">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Senior Representatives</h1>
          <p className="text-gray-600">View individual SR profiles and performance</p>
        </div>
        <Button
          variant="outline"
          onClick={loadSRs}
          className="flex items-center space-x-2"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Refresh</span>
        </Button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {srs.map((sr) => (
          <Link key={sr.id} to={`/sr/${sr.referralCode}`}>
            <Card className="p-6 text-center hover:shadow-lg transition-all duration-300 cursor-pointer group">
              <div className="relative mb-4">
                <img
                  src={sr.profileImage}
                  alt={sr.name}
                  className="w-24 h-24 rounded-full mx-auto object-cover border-4 border-gray-200 group-hover:border-red-400 transition-all duration-300"
                />
                <div className="absolute -bottom-2 -right-8 bg-green-500 text-white rounded-full p-1">
                  <Users className="w-4 h-4" />
                </div>
              </div>
              <h3 className="text-lg font-semibold mb-2 group-hover:text-red-600 transition-colors">
                {sr.name}
              </h3>
              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex justify-between">
                  <span>Registrations:</span>
                  <span className="font-medium text-red-600">{sr.totalCustomersRegistered}</span>
                </div>
                <div className="flex justify-between">
                  <span>Orders:</span>
                  <span className="font-medium text-yellow-600">{sr.totalOrders}</span>
                </div>
                <div className="flex justify-between">
                  <span>Revenue:</span>
                  <span className="font-medium text-green-600">${sr.totalOrderValue.toFixed(2)}</span>
                </div>
              </div>
              <Button className="mt-4 w-full bg-red-600 hover:bg-red-700 text-white group-hover:shadow-lg transition-all duration-300">
                View Profile
              </Button>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}

export default App;

