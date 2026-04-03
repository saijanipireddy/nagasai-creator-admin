import { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { authAPI, setTokens, clearTokens, getAccessToken, getRefreshToken } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);

  // On mount: if we have an access token in memory, verify it.
  // If not, try the refresh endpoint (which uses cookies if available).
  useEffect(() => {
    let cancelled = false;

    const checkAuth = async () => {
      try {
        // If we have a token in memory, try profile directly
        if (getAccessToken()) {
          const { data } = await authAPI.getProfile();
          if (!cancelled) setAdmin(data);
          return;
        }

        // No access token in memory — try refresh using stored refresh token
        const storedRefresh = getRefreshToken();
        if (!storedRefresh) {
          if (!cancelled) setAdmin(null);
          return;
        }
        try {
          const { data } = await authAPI.refresh(storedRefresh);
          if (data.accessToken) {
            setTokens(data.accessToken, data.refreshToken);
          }
          if (!cancelled) setAdmin({ _id: data._id, name: data.name, email: data.email });
        } catch {
          clearTokens();
          if (!cancelled) setAdmin(null);
        }
      } catch {
        // Profile call failed even with token — clear and go to login
        clearTokens();
        if (!cancelled) setAdmin(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    checkAuth();
    return () => { cancelled = true; };
  }, []);

  const login = useCallback(async (email, password) => {
    try {
      const { data } = await authAPI.login({ email, password });
      // Store tokens in memory
      if (data.accessToken) {
        setTokens(data.accessToken, data.refreshToken);
      }
      setAdmin({ _id: data._id, name: data.name, email: data.email });
      return { success: true };
    } catch (error) {
      return { success: false, message: error.response?.data?.message || 'Login failed' };
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await authAPI.logout();
    } catch {
      // Ignore errors — clear local state regardless
    }
    clearTokens();
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
