import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.js';
import { useTheme } from '../../context/ThemeContext.js';
import { useToast } from '../../context/ToastContext.js';
import {
  Film,
  Search,
  Sun,
  Moon,
  User as UserIcon,
  LogOut,
  Download,
  Bookmark,
  ShieldAlert,
  Menu,
  X,
  Sparkles,
  Zap,
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const { user, isAdmin, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const [scrolled, setScrolled] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [installable, setInstallable] = useState(false);

  const handleScroll = useCallback(() => {
    setScrolled(window.scrollY > 20);
  }, []);

  useEffect(() => {
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: BeforeInstallPromptEvent) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setInstallable(true);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt as EventListener);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt as EventListener);
  }, []);

  const handleInstallPWA = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      if (choiceResult.outcome === 'accepted') {
        showToast('AsianFlix installed to your app launcher!', 'success');
      }
      setDeferredPrompt(null);
      setInstallable(false);
    } else {
      showToast('PWA App ready! Tap "Add to Home Screen" in your browser menu.', 'info');
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
      setMobileMenuOpen(false);
    }
  };

  const navLinks = [
    { path: '/', label: 'Home', icon: Film },
    { path: '/search', label: 'Explore', icon: Search },
  ] as const;

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-gray-950/90 backdrop-blur-xl shadow-[0_4px_20px_-4px_rgba(0,0,0,0.4)] border-b border-white/10 py-3'
          : 'bg-gradient-to-b from-gray-950/95 via-gray-950/70 to-transparent py-4'
      }`}
    >
      <div className="container flex items-center justify-between gap-4">
        {/* Brand Logo */}
        <Link to="/" className="flex items-center gap-3 group" aria-label="AsianFlix Home">
          <div className="relative">
            <img
              src="/logo.svg"
              alt=""
              className="w-9 h-9 rounded-xl object-contain shadow-lg shadow-black/50 border border-white/10 group-hover:scale-105 transition-transform duration-300"
            />
            <span className="absolute -bottom-1 -right-1 w-5 h-5 bg-gradient-to-r from-cyan-400 to-blue-600 rounded-full flex items-center justify-center">
              <Zap className="w-3 h-3 text-gray-950" />
            </span>
          </div>
          <div className="hidden sm:block">
            <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-white via-gray-100 to-cyan-400 bg-clip-text text-transparent">
              Asian<span className="text-cyan-400">Flix</span>
            </span>
            <span className="inline-block ml-2 px-1.5 py-0.5 text-[10px] font-bold tracking-wider text-cyan-400 bg-cyan-400/10 border border-cyan-400/30 rounded-full">
              PRO
            </span>
          </div>
        </Link>

        {/* Search Bar - Desktop */}
        <form onSubmit={handleSearchSubmit} className="hidden lg:flex flex-1 max-w-xl relative" role="search">
          <label htmlFor="global-search" className="sr-only">Search dramas</label>
          <input
            id="global-search"
            type="search"
            placeholder="Search dramas, actors, directors, genres..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-gray-900/80 border border-white/10 focus:border-cyan-400/80 text-white placeholder-gray-500 text-sm rounded-full py-2.5 pl-11 pr-4 outline-none transition-all focus:bg-gray-900 focus:ring-2 focus:ring-cyan-400/30"
            autoComplete="off"
          />
          <Search className="w-4.5 h-4.5 text-gray-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" aria-hidden="true" />
        </form>

        {/* Navigation Actions */}
        <nav className="hidden lg:flex items-center gap-1" aria-label="Main navigation">
          {navLinks.map(({ path, label, icon: Icon }) => (
            <Link
              key={path}
              to={path}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                location.pathname === path
                  ? 'bg-cyan-400/10 text-cyan-400 font-semibold'
                  : 'text-gray-300 hover:text-white hover:bg-white/5'
              }`}
            >
              <Icon className="w-4 h-4" aria-hidden="true" />
              <span>{label}</span>
            </Link>
          ))}
          {user && (
            <Link
              to="/profile"
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                location.pathname === '/profile' || location.pathname === '/watchlist' || location.pathname === '/history'
                  ? 'bg-cyan-400/10 text-cyan-400 font-semibold'
                  : 'text-gray-300 hover:text-white hover:bg-white/5'
              }`}
            >
              <Bookmark className="w-4 h-4" aria-hidden="true" />
              <span>Watchlist</span>
            </Link>
          )}
          {isAdmin && (
            <Link
              to="/admin"
              className="px-3 py-2 rounded-xl bg-cyan-400/10 border border-cyan-400/30 text-cyan-400 hover:bg-cyan-400/20 text-sm font-semibold flex items-center gap-2 transition-all"
            >
              <ShieldAlert className="w-4 h-4" aria-hidden="true" />
              <span>Admin</span>
            </Link>
          )}
        </nav>

        {/* Right Section Tools */}
        <div className="flex items-center gap-2">
          {/* PWA Download Button */}
          {installable && (
            <button
              onClick={handleInstallPWA}
              title="Install App as PWA"
              className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-xl bg-gray-900/80 hover:bg-gray-800 border border-white/10 text-gray-200 hover:text-white transition-all text-sm font-medium"
            >
              <Download className="w-4 h-4 text-cyan-400" aria-hidden="true" />
              <span>Install App</span>
            </button>
          )}

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            className="p-2.5 rounded-xl bg-gray-900/80 hover:bg-gray-800 border border-white/10 text-gray-300 hover:text-white transition-all"
            aria-label={theme === 'dark' ? 'Enable light mode' : 'Enable dark mode'}
          >
            {theme === 'dark' ? (
              <Sun className="w-4.5 h-4.5 text-amber-400" aria-hidden="true" />
            ) : (
              <Moon className="w-4.5 h-4.5 text-cyan-400" aria-hidden="true" />
            )}
          </button>

          {/* User Section */}
          {user ? (
            <div className="flex items-center gap-2">
              <Link
                to="/profile"
                className="flex items-center gap-2.5 group hidden sm:flex"
                aria-label={`View ${user.name}'s profile`}
              >
                <div className="relative">
                  <img
                    src={user.avatar}
                    alt=""
                    className="w-8 h-8 rounded-full border border-cyan-400/50 object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <span className="absolute -bottom-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full border-2 border-gray-950" aria-hidden="true" />
                </div>
                <span className="text-sm font-medium text-gray-200 group-hover:text-cyan-400 transition-colors max-w-[120px] truncate">
                  {user.name}
                </span>
              </Link>
              <button
                onClick={logout}
                title="Logout"
                className="p-2.5 rounded-xl bg-gray-800/50 hover:bg-rose-500/20 text-gray-400 hover:text-rose-400 transition-all"
                aria-label="Sign out"
              >
                <LogOut className="w-4.5 h-4.5" aria-hidden="true" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                to="/login"
                className="hidden sm:inline-flex px-4 py-2 text-sm font-semibold text-gray-200 hover:text-white transition-colors"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className="px-4 py-2 text-sm font-bold text-gray-950 bg-gradient-to-r from-cyan-400 to-blue-600 hover:brightness-110 rounded-xl shadow-lg shadow-cyan-500/20 transition-all"
              >
                Join Free
              </Link>
            </div>
          )}

          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2.5 rounded-xl bg-gray-900/80 hover:bg-gray-800 border border-white/10 text-gray-300 hover:text-white transition-all"
            aria-expanded={mobileMenuOpen}
            aria-controls="mobile-menu"
            aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
          >
            {mobileMenuOpen ? <X className="w-5.5 h-5.5" /> : <Menu className="w-5.5 h-5.5" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Drawer */}
      {mobileMenuOpen && (
        <div
          id="mobile-menu"
          className="lg:hidden bg-gray-950 border-b border-white/10 px-4 py-4 space-y-3 animate-slide-down"
          role="navigation"
          aria-label="Mobile navigation"
        >
          <form onSubmit={handleSearchSubmit} className="relative mb-3">
            <label htmlFor="mobile-search" className="sr-only">Search dramas</label>
            <input
              id="mobile-search"
              type="search"
              placeholder="Search dramas, actors..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-gray-900 border border-gray-800 text-white text-sm rounded-xl py-2.5 pl-10 pr-4 outline-none focus:border-cyan-400/80"
              autoComplete="off"
            />
            <Search className="w-4.5 h-4.5 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" aria-hidden="true" />
          </form>
          <Link
            to="/"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2.5 rounded-xl text-sm font-medium text-gray-200 hover:text-cyan-400 hover:bg-white/5 transition-all"
          >
            <Film className="w-4.5 h-4.5 inline mr-2" aria-hidden="true" />
            Home
          </Link>
          <Link
            to="/search"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2.5 rounded-xl text-sm font-medium text-gray-200 hover:text-cyan-400 hover:bg-white/5 transition-all"
          >
            <Search className="w-4.5 h-4.5 inline mr-2" aria-hidden="true" />
            Search & Filter
          </Link>
          {user && (
            <Link
              to="/profile"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2.5 rounded-xl text-sm font-medium text-gray-200 hover:text-cyan-400 hover:bg-white/5 transition-all"
            >
              <Bookmark className="w-4.5 h-4.5 inline mr-2" aria-hidden="true" />
              My Profile & Watchlist
            </Link>
          )}
          {isAdmin && (
            <Link
              to="/admin"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2.5 rounded-xl text-sm font-medium text-cyan-400 hover:text-cyan-300 hover:bg-cyan-400/10 transition-all flex items-center gap-2"
            >
              <ShieldAlert className="w-4.5 h-4.5" aria-hidden="true" />
              Admin Dashboard
            </Link>
          )}
          {installable && (
            <button
              onClick={handleInstallPWA}
              className="w-full px-3 py-2.5 rounded-xl text-sm font-medium text-gray-200 hover:text-cyan-400 hover:bg-white/5 transition-all flex items-center gap-2"
            >
              <Download className="w-4.5 h-4.5" aria-hidden="true" />
              Install App
            </button>
          )}
        </div>
      )}
    </header>
  );
};

// Type for beforeinstallprompt event
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}