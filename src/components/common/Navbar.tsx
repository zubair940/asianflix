import React, { useState, useEffect } from 'react';
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
  ShieldAlert,
  Download,
  Bookmark,
  Sparkles,
  Menu,
  X
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
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 40);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  const handleInstallPWA = () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      deferredPrompt.userChoice.then((choiceResult: any) => {
        if (choiceResult.outcome === 'accepted') {
          showToast('AsianFlix installed to your app launcher!', 'success');
        }
        setDeferredPrompt(null);
      });
    } else {
      showToast('PWA App ready! Tap "Add to Home Screen" in your browser menu.', 'info');
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
    }
  };

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-[#050505]/90 backdrop-blur-xl shadow-2xl border-b border-white/10 py-3'
          : 'bg-gradient-to-b from-[#050505]/95 via-[#050505]/70 to-transparent py-4'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4">
        {/* Brand Logo */}
        <Link to="/" className="flex items-center gap-2.5 group">
          <img
            src="/logo.svg"
            alt="AsianFlix Logo"
            className="w-9 h-9 rounded-xl object-contain shadow-md shadow-black/50 border border-slate-700/50 group-hover:scale-105 transition-transform"
          />
          <div>
            <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-white via-slate-100 to-[#00C2FF] bg-clip-text text-transparent">
              Asian<span className="text-[#00C2FF]">Flix</span>
            </span>
            <span className="hidden sm:inline-block ml-2 px-1.5 py-0.5 text-[10px] font-semibold tracking-wider text-[#00C2FF] bg-[#00C2FF]/10 border border-[#00C2FF]/30 rounded-md">
              PRO
            </span>
          </div>
        </Link>

        {/* Search Bar - Desktop */}
        <form onSubmit={handleSearchSubmit} className="hidden md:flex flex-1 max-w-md relative">
          <input
            type="text"
            placeholder="Search dramas, cast, director, romance, thriller..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-900/90 border border-white/10 focus:border-[#00C2FF]/80 text-white placeholder-slate-400 text-sm rounded-full py-2 pl-10 pr-4 outline-none transition-all focus:bg-slate-900 focus:ring-2 focus:ring-[#00C2FF]/30"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        </form>

        {/* Navigation Actions */}
        <div className="hidden lg:flex items-center gap-6">
          <Link
            to="/"
            className={`text-sm font-medium transition-colors hover:text-[#00C2FF] ${
              location.pathname === '/' ? 'text-[#00C2FF] font-semibold' : 'text-slate-300'
            }`}
          >
            Home
          </Link>
          <Link
            to="/search"
            className={`text-sm font-medium transition-colors hover:text-[#00C2FF] ${
              location.pathname === '/search' ? 'text-[#00C2FF] font-semibold' : 'text-slate-300'
            }`}
          >
            Explore & Filters
          </Link>
          {user && (
            <Link
              to="/profile"
              className={`text-sm font-medium transition-colors hover:text-[#00C2FF] flex items-center gap-1.5 ${
                location.pathname === '/profile' ? 'text-[#00C2FF] font-semibold' : 'text-slate-300'
              }`}
            >
              <Bookmark className="w-4 h-4" />
              Watchlist
            </Link>
          )}
          {isAdmin && (
            <Link
              to="/admin"
              className="px-3 py-1.5 rounded-lg bg-[#00C2FF]/10 border border-[#00C2FF]/30 text-[#00C2FF] hover:bg-[#00C2FF]/20 text-xs font-semibold flex items-center gap-1.5 transition-all"
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              Admin Panel
            </Link>
          )}
        </div>

        {/* Right Section Tools */}
        <div className="flex items-center gap-3">
          {/* PWA Download Button */}
          <button
            onClick={handleInstallPWA}
            title="Install App as PWA"
            className="p-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-white/10 text-slate-300 hover:text-white transition-all text-xs flex items-center gap-1.5"
          >
            <Download className="w-4 h-4 text-[#00C2FF]" />
            <span className="hidden sm:inline">Install App</span>
          </button>

          {/* Dark / Light Toggle */}
          <button
            onClick={toggleTheme}
            title="Toggle theme"
            className="p-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-white/10 text-slate-300 hover:text-white transition-all"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-cyan-400" />}
          </button>

          {/* User Section */}
          {user ? (
            <div className="flex items-center gap-3">
              <Link to="/profile" className="flex items-center gap-2 group">
                <img
                  src={user.avatar}
                  alt={user.name}
                  className="w-8 h-8 rounded-full border border-[#00C2FF]/50 object-cover group-hover:scale-105 transition-transform"
                />
                <span className="hidden sm:inline text-sm font-medium text-slate-200 group-hover:text-[#00C2FF] transition-colors max-w-[100px] truncate">
                  {user.name}
                </span>
              </Link>
              <button
                onClick={logout}
                title="Logout"
                className="p-2 rounded-xl bg-slate-800/40 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition-all"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                to="/login"
                className="px-3.5 py-1.5 text-xs font-semibold text-slate-200 hover:text-white transition-colors"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className="px-4 py-1.5 text-xs font-semibold text-black bg-gradient-to-r from-[#00C2FF] to-[#0047FF] hover:brightness-110 rounded-xl shadow-lg shadow-cyan-500/20 transition-all"
              >
                Join Free
              </Link>
            </div>
          )}

          {/* Mobile Menu Toggle Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 text-slate-300 hover:text-white"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-slate-900 border-b border-slate-800 px-4 py-4 space-y-3">
          <form onSubmit={handleSearchSubmit} className="relative mb-3">
            <input
              type="text"
              placeholder="Search dramas, cast..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 text-white text-sm rounded-lg py-2 pl-9 pr-3 outline-none"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          </form>
          <Link
            to="/"
            onClick={() => setMobileMenuOpen(false)}
            className="block text-sm font-medium text-slate-200 hover:text-rose-400 py-1"
          >
            Home
          </Link>
          <Link
            to="/search"
            onClick={() => setMobileMenuOpen(false)}
            className="block text-sm font-medium text-slate-200 hover:text-rose-400 py-1"
          >
            Search & Filter
          </Link>
          {user && (
            <Link
              to="/profile"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-sm font-medium text-slate-200 hover:text-rose-400 py-1"
            >
              My Profile & Watchlist
            </Link>
          )}
          {isAdmin && (
            <Link
              to="/admin"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-sm font-medium text-rose-400 hover:text-rose-300 py-1"
            >
              Admin Dashboard
            </Link>
          )}
        </div>
      )}
    </nav>
  );
};
