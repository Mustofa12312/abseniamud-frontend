import { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/auth';

const AuthContext = createContext(undefined);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if token exists, then load user profile
    const token = localStorage.getItem('iaimu_token');
    const savedUser = localStorage.getItem('iaimu_user');
    
    if (token && savedUser) {
      setUser(JSON.parse(savedUser));
      // Optionally fetch latest profile in background
      authService.me()
        .then(res => {
           if(res.success) {
               setUser(res.data);
               localStorage.setItem('iaimu_user', JSON.stringify(res.data));
           }
        })
        .catch(() => {
           // Token might be invalid, interceptor will handle redirect
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email, password) => {
    const res = await authService.login(email, password);
    if (res.success && res.data) {
      localStorage.setItem('iaimu_token', res.data.token);
      localStorage.setItem('iaimu_user', JSON.stringify(res.data.user));
      setUser(res.data.user);
    }
    return res;
  };

  const logout = async () => {
    try {
      await authService.logout();
    } finally {
      localStorage.removeItem('iaimu_token');
      localStorage.removeItem('iaimu_user');
      setUser(null);
      window.location.href = '/login';
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading, isAuthenticated: !!user }}>
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
