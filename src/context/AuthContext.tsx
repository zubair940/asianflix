import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '../types.js';
import { authService } from '../services/authService.js';
import { userService } from '../services/userService.js';
import { useToast } from './ToastContext.js';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAdmin: boolean;
  login: (email: string, pass: string) => Promise<void>;
  register: (name: string, email: string, pass: string, confirm: string) => Promise<void>;
  logout: () => void;
  toggleWatchlist: (dramaId: string) => Promise<boolean>;
  updateUser: (updatedUser: User) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  useEffect(() => {
    const token = localStorage.getItem('kdramabox_token');
    if (token) {
      authService.getMe()
        .then((res) => {
          setUser(res.user);
        })
        .catch(() => {
          localStorage.removeItem('kdramabox_token');
          setUser(null);
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email: string, pass: string) => {
    try {
      const res = await authService.login(email, pass);
      localStorage.setItem('kdramabox_token', res.token);
      setUser(res.user);
      showToast(`Welcome back, ${res.user.name}!`, 'success');
    } catch (err: any) {
      showToast(err.message || 'Login failed', 'error');
      throw err;
    }
  };

  const register = async (name: string, email: string, pass: string, confirm: string) => {
    try {
      const res = await authService.register(name, email, pass, confirm);
      localStorage.setItem('kdramabox_token', res.token);
      setUser(res.user);
      showToast(`Account created successfully! Welcome, ${res.user.name}`, 'success');
    } catch (err: any) {
      showToast(err.message || 'Registration failed', 'error');
      throw err;
    }
  };

  const logout = () => {
    localStorage.removeItem('kdramabox_token');
    setUser(null);
    showToast('Logged out successfully', 'info');
  };

  const toggleWatchlist = async (dramaId: string): Promise<boolean> => {
    if (!user) {
      showToast('Please login to add to Watchlist', 'info');
      return false;
    }
    try {
      const res = await userService.toggleWatchlist(dramaId);
      setUser((prev) => prev ? { ...prev, watchlist: res.watchlist } : null);
      showToast(res.message, 'success');
      return res.added;
    } catch (err: any) {
      showToast(err.message || 'Failed to update watchlist', 'error');
      return false;
    }
  };

  const updateUser = (updatedUser: User) => {
    setUser(updatedUser);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAdmin: Boolean(user && user.role === 'admin' && user.email.toLowerCase() === 'iamzubair708@gmail.com'),
        login,
        register,
        logout,
        toggleWatchlist,
        updateUser
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
