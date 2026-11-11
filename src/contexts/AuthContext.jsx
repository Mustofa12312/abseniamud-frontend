import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authService } from '../services/auth';

const AuthContext = createContext(undefined);

function readStoredUser() {
  try {
    const token = localStorage.getItem('iaimu_token');
    const savedUser = localStorage.getItem('iaimu_user');
    if (token && savedUser) {
      return JSON.parse(savedUser);
    }
  } catch {
    localStorage.removeItem('iaimu_user');
  }
  return null;
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(readStoredUser);
  const [loading, setLoading] = useState(() => {
    const token = localStorage.getItem('iaimu_token');
    const savedUser = localStorage.getItem('iaimu_user');
    return Boolean(token && !savedUser);
  });

  const refreshUser = useCallback(async () => {
    const token = localStorage.getItem('iaimu_token');
    if (!token) return null;

    const res = await authService.me();
    if (res?.success && res?.data) {
      setUser(res.data);
      localStorage.setItem('iaimu_user', JSON.stringify(res.data));
      return res.data;
    }
    return null;
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('iaimu_token');
    if (!token) return;

    let cancelled = false;
    authService.me()
      .then((res) => {
        if (!cancelled && res?.success && res?.data) {
          setUser(res.data);
          localStorage.setItem('iaimu_user', JSON.stringify(res.data));
        }
      })
      .catch(() => {
        // Token might be invalid, interceptor handles 401 redirect when needed
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(async (email, password) => {
    const res = await authService.login(email, password);
    if (res.success && res.data) {
      localStorage.setItem('iaimu_token', res.data.token);
      localStorage.setItem('iaimu_user', JSON.stringify(res.data.user));
      setUser(res.data.user);
    }
    return res;
  }, []);

  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } catch {
      // Ignore network errors during logout cleanup
    } finally {
      localStorage.removeItem('iaimu_token');
      localStorage.removeItem('iaimu_user');
      localStorage.removeItem('iaimu_admin_notif_read_sig');
      Object.keys(localStorage)
        .filter((k) => k.startsWith('iaimu_admin_notif_read_sig_'))
        .forEach((k) => localStorage.removeItem(k));
      setUser(null);
      window.location.href = '/login';
    }
  }, []);

  return (
    <AuthContext.Provider value={{ user, login, logout, refreshUser, loading, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
