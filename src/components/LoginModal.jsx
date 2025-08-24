import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Lock, Eye, EyeOff, Shield, Timer } from 'lucide-react';
import { Button } from './ui/button.jsx';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card.jsx';
import { useAuth } from '../contexts/AuthContext';
import MaalcoLogo from '../assets/maalco-logo.jpg';

function LoginModal() {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [remainingTime, setRemainingTime] = useState(0);
  
  const { login, lockoutUntil, loginAttempts } = useAuth();

  // Update remaining lockout time
  useEffect(() => {
    let timer;
    if (lockoutUntil) {
      const updateTimer = () => {
        const now = new Date().getTime();
        const remaining = Math.max(0, Math.ceil((lockoutUntil - now) / 1000));
        setRemainingTime(remaining);
        
        if (remaining > 0) {
          timer = setTimeout(updateTimer, 1000);
        } else {
          setError('');
        }
      };
      updateTimer();
    }
    
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [lockoutUntil]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!password.trim() || remainingTime > 0) return;

    setIsLoading(true);
    setError('');

    try {
      await login(password);
    } catch (err) {
      setError(err.message);
      setPassword('');
    } finally {
      setIsLoading(false);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Frosted Glass Backdrop */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="absolute inset-0 backdrop-blur-md bg-white/30"
        style={{
          backdropFilter: 'blur(8px) saturate(180%)',
          WebkitBackdropFilter: 'blur(8px) saturate(180%)',
        }}
      />
      
      {/* Login Modal */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 50 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="relative z-10 w-full max-w-md mx-4"
      >
        <Card className="shadow-2xl border-0 bg-white/95 backdrop-blur-sm">
          <CardHeader className="text-center space-y-4 pb-6">
            <div className="flex justify-center">
              <div className="w-16 h-16 rounded-xl overflow-hidden shadow-lg">
                <img 
                  src={MaalcoLogo} 
                  alt="Maalco Foods Logo" 
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
            
            <div>
              <CardTitle className="text-2xl font-bold text-gray-900 flex items-center justify-center">
                <Lock className="w-6 h-6 mr-2 text-red-600" />
                Secure Access
              </CardTitle>
              <p className="text-gray-600 mt-2">
                Enter your credentials to access the SR Performance Dashboard
              </p>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Password Input */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 flex items-center">
                  <Shield className="w-4 h-4 mr-2 text-gray-500" />
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isLoading || remainingTime > 0}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 disabled:bg-gray-50 disabled:text-gray-500"
                    placeholder="Enter your password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={remainingTime > 0}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 disabled:opacity-50"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {/* Error Messages */}
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-red-50 border border-red-200 rounded-lg p-3"
                >
                  <p className="text-red-600 text-sm font-medium">{error}</p>
                </motion.div>
              )}

              {/* Lockout Timer */}
              {remainingTime > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-orange-50 border border-orange-200 rounded-lg p-3"
                >
                  <div className="flex items-center text-orange-600">
                    <Timer className="w-4 h-4 mr-2" />
                    <span className="text-sm font-medium">
                      Account locked for {formatTime(remainingTime)}
                    </span>
                  </div>
                </motion.div>
              )}

              {/* Login Button */}
              <Button
                type="submit"
                disabled={isLoading || remainingTime > 0 || !password.trim()}
                className="w-full bg-red-600 hover:bg-red-700 text-white py-3 rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <div className="flex items-center">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Authenticating...
                  </div>
                ) : remainingTime > 0 ? (
                  `Locked (${formatTime(remainingTime)})`
                ) : (
                  'Access Dashboard'
                )}
              </Button>
            </form>

            {/* Security Info */}
            <div className="text-center pt-4 border-t border-gray-200">
              <p className="text-xs text-gray-500">
                Security Notice: Failed login attempts will result in temporary account lockout
              </p>
              {loginAttempts > 0 && loginAttempts < 3 && (
                <p className="text-xs text-orange-600 mt-1 font-medium">
                  {3 - loginAttempts} attempts remaining before lockout
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}

export default LoginModal;