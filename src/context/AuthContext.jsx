import { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext(null);

// Decode JWT and check if expired
const isTokenExpired = (token) => {
  if (!token) return true;
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.exp * 1000 < Date.now();
  } catch {
    return true;
  }
};

export const AuthProvider = ({ children }) => {
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    const adminInfo = localStorage.getItem('adminInfo');

    if (token && adminInfo && !isTokenExpired(token)) {
      setAdmin(JSON.parse(adminInfo));
    } else {
      // Clear stale data
      localStorage.removeItem('adminToken');
      localStorage.removeItem('adminInfo');
    }
    setLoading(false);
  }, []);

  const login = useCallback(async (email, password) => {
    try {
      const { data } = await authAPI.login({ email, password });
      localStorage.setItem('adminToken', data.token);
      localStorage.setItem('adminInfo', JSON.stringify(data));
      setAdmin(data);
      return { success: true };
    } catch (error) {
      return { success: false, message: error.response?.data?.message || 'Login failed' };
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminInfo');
    setAdmin(null);
  }, []);

  const value = useMemo(
    () => ({ admin, loading, login, logout, isAuthenticated: !!admin }),
    [admin, loading, login, logout]
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
