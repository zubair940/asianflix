import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
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
  logout: () => Promise<void>;
  toggleWatchlist: (dramaId: string) => Promise<boolean>;
  updateUser: (updatedUser: User) => void;
  refreshAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const STORAGE_KEYS = [
  'kdramabox_token',
  'kdramabox_theme',
  'asianflix_theme',
  'watchHistory',
  'userPreferences',
] as const;

function clearAllStorage() {
  if (typeof window !== 'undefined') {
    STORAGE_KEYS.forEach(key => {
      localStorage.removeItem(key);
      sessionStorage.removeItem(key);
    });
    // Clear any other potential auth-related keys
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('kdramabox_') || key.startsWith('asianflix_')) {
        localStorage.removeItem(key);
      }
    });
    Object.keys(sessionStorage).forEach(key => {
      if (key.startsWith('kdramabox_') || key.startsWith('asianflix_')) {
        sessionStorage.removeItem(key);
      }
    });
  }
}

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  const fetchUser = useCallback(async () => {
    try {
      const res = await authService.getMe();
      setUser(res.user);
    } catch {
      try {
        await authService.refresh();
        const res = await authService.getMe();
        setUser(res.user);
      } catch {
        setUser(null);
      }
    }
  }, []);

  useEffect(() => {
    fetchUser().finally(() => setLoading(false));
  }, [fetchUser]);

  const login = async (email: string, pass: string) => {
    try {
      const res = await authService.login(email, pass);
      setUser(res.user);
      showToast(`Welcome back, ${res.user.name}`, 'success');
    } catch (err: unknown) {
      const error = err as Error;
      showToast(error.message || 'Login failed', 'error');
      throw err;
    }
  };

  const register = async (name: string, email: string, pass: string, confirm: string) => {
    try {
      const res = await authService.register(name, email, pass, confirm);
      setUser(res.user);
      showToast(`Account created successfully. Welcome, ${res.user.name}`, 'success');
    } catch (err: unknown) {
      const error = err as Error;
      showToast(error.message || 'Registration failed', 'error');
      throw err;
    }
  };

  const logout = async () => {
    try {
      await authService.logout();
    } catch {
      // Ignore API errors, proceed with local cleanup
    } finally {
      clearAllStorage();
      setUser(null);
      showToast('Logged out successfully', 'info');
    }
  };

  const toggleWatchlist = async (dramaId: string): Promise<boolean> => {
    if (!user) {
      showToast('Please login to add to Watchlist', 'info');
      return false;
    }
    try {
      const res = await userService.toggleWatchlist(dramaId);
      setUser(prev => prev ? { ...prev, watchlist: res.watchlist } : null);
      showToast(res.message, 'success');
      return res.added;
    } catch (err: unknown) {
      const error = err as Error;
      showToast(error.message || 'Failed to update watchlist', 'error');
      return false;
    }
  };

  const updateUser = (updatedUser: User) => {
    setUser(updatedUser);
  };

  const refreshAuth = async () => {
    await fetchUser();
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
        updateUser,
        refreshAuth
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