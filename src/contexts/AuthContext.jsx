import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loginAttempts, setLoginAttempts] = useState(0);
  const [lockoutUntil, setLockoutUntil] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check if user is authenticated on mount
  useEffect(() => {
    const authToken = localStorage.getItem('maalco_auth_token');
    const authExpiry = localStorage.getItem('maalco_auth_expiry');
    
    if (authToken && authExpiry) {
      const now = new Date().getTime();
      if (now < parseInt(authExpiry)) {
        setIsAuthenticated(true);
      } else {
        // Token expired, remove it
        localStorage.removeItem('maalco_auth_token');
        localStorage.removeItem('maalco_auth_expiry');
      }
    }
    
    // Load lockout data
    const lockoutData = localStorage.getItem('maalco_lockout');
    const attemptsData = localStorage.getItem('maalco_attempts');
    
    if (lockoutData) {
      const lockoutTime = parseInt(lockoutData);
      const now = new Date().getTime();
      
      if (now < lockoutTime) {
        setLockoutUntil(lockoutTime);
      } else {
        localStorage.removeItem('maalco_lockout');
        localStorage.removeItem('maalco_attempts');
      }
    }
    
    if (attemptsData) {
      setLoginAttempts(parseInt(attemptsData));
    }
    
    setIsLoading(false);
  }, []);

  // Calculate lockout duration based on attempts
  const getLockoutDuration = (attempts) => {
    if (attempts <= 3) return 10 * 1000; // 10 seconds
    if (attempts <= 4) return 15 * 1000; // 15 seconds  
    if (attempts <= 5) return 30 * 1000; // 30 seconds
    if (attempts <= 6) return 60 * 1000; // 1 minute
    if (attempts <= 7) return 120 * 1000; // 2 minutes
    return 180 * 1000; // 3 minutes for all subsequent attempts
  };

  const login = async (password) => {
    // Check if currently locked out
    if (lockoutUntil) {
      const now = new Date().getTime();
      if (now < lockoutUntil) {
        const remainingTime = Math.ceil((lockoutUntil - now) / 1000);
        throw new Error(`Account locked. Please wait ${remainingTime} seconds.`);
      } else {
        // Lockout expired, clear it
        setLockoutUntil(null);
        setLoginAttempts(0);
        localStorage.removeItem('maalco_lockout');
        localStorage.removeItem('maalco_attempts');
      }
    }

    // Validate password (hardcoded as requested)
    if (password === 'maalco2025') {
      // Successful login
      const token = btoa(`maalco:${Date.now()}`);
      const expiry = new Date().getTime() + (24 * 60 * 60 * 1000); // 24 hours
      
      localStorage.setItem('maalco_auth_token', token);
      localStorage.setItem('maalco_auth_expiry', expiry.toString());
      
      // Clear lockout data on successful login
      setLoginAttempts(0);
      setLockoutUntil(null);
      localStorage.removeItem('maalco_lockout');
      localStorage.removeItem('maalco_attempts');
      
      setIsAuthenticated(true);
      return true;
    } else {
      // Failed login
      const newAttempts = loginAttempts + 1;
      setLoginAttempts(newAttempts);
      localStorage.setItem('maalco_attempts', newAttempts.toString());
      
      // Set lockout if needed
      if (newAttempts >= 3) {
        const lockoutDuration = getLockoutDuration(newAttempts);
        const lockoutTime = new Date().getTime() + lockoutDuration;
        
        setLockoutUntil(lockoutTime);
        localStorage.setItem('maalco_lockout', lockoutTime.toString());
        
        throw new Error(`Invalid password. Account locked for ${Math.ceil(lockoutDuration / 1000)} seconds.`);
      } else {
        throw new Error(`Invalid password. ${3 - newAttempts} attempts remaining.`);
      }
    }
  };

  const logout = () => {
    localStorage.removeItem('maalco_auth_token');
    localStorage.removeItem('maalco_auth_expiry');
    setIsAuthenticated(false);
  };

  const value = {
    isAuthenticated,
    login,
    logout,
    isLoading,
    lockoutUntil,
    loginAttempts
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}