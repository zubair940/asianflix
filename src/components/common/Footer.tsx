import React from 'react';
import { Link } from 'react-router-dom';
import { Film, Heart, Sparkles, Globe, Shield, Tv, Download, Twitter, Youtube } from 'lucide-react';

export const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gray-950 border-t border-white/10 text-gray-400" role="contentinfo">
      <div className="container py-16 lg:py-20">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 lg:gap-12 mb-16">
          {/* Brand Column */}
          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center gap-3">
              <div className="relative w-10 h-10 rounded-xl overflow-hidden border border-white/10 shadow-lg">
                <img
                  src="/logo.svg"
                  alt=""
                  className="w-full h-full object-contain"
                />
              </div>
              <span className="text-2xl font-bold tracking-tight bg-gradient-to-r from-white via-gray-100 to-cyan-400 bg-clip-text text-transparent">
                Asian<span className="text-cyan-400">Flix</span>
              </span>
            </div>
            <p className="text-sm text-gray-400 leading-relaxed max-w-xs">
              The ultimate high-definition Asian Drama streaming hub. Watch your favorite K-Dramas, C-Dramas, Pakistani Dramas, Turkish Dramas, J-Dramas & more with multi-language subtitles across devices.
            </p>
            <div className="flex flex-wrap gap-3 text-sm text-gray-500">
              <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gray-900 border border-white/10">
                <Tv className="w-4 h-4 text-cyan-400" aria-hidden="true" />
                Full HD 1080p
              </span>
              <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gray-900 border border-white/10">
                <Globe className="w-4 h-4 text-cyan-400" aria-hidden="true" />
                Multi-Subs
              </span>
              <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gray-900 border border-white/10">
                <Sparkles className="w-4 h-4 text-cyan-400" aria-hidden="true" />
                PWA Ready
              </span>
            </div>
            <div className="flex items-center gap-4 pt-2">
              <a href="https://x.com/asianflixon" target="_blank" rel="noopener noreferrer" className="p-2 rounded-xl bg-gray-900 border border-white/10 text-gray-400 hover:text-cyan-400 hover:border-cyan-400/50 transition-all" aria-label="Follow us on X">
                <Twitter className="w-5 h-5" />
              </a>
              <a href="https://www.youtube.com/@Asianflix-offical" target="_blank" rel="noopener noreferrer" className="p-2 rounded-xl bg-gray-900 border border-white/10 text-gray-400 hover:text-cyan-400 hover:border-cyan-400/50 transition-all" aria-label="YouTube Channel">
                <Youtube className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Navigation */}
          <nav className="space-y-4" aria-label="Quick navigation">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-200 mb-4">Quick Navigation</h4>
            <ul className="space-y-3 text-sm">
              <li><Link to="/" className="hover:text-cyan-400 transition-colors">Home & Trending</Link></li>
              <li><Link to="/search" className="hover:text-cyan-400 transition-colors">Genre & Category Discovery</Link></li>
              <li><Link to="/search?sort=rating" className="hover:text-cyan-400 transition-colors">Top Rated Dramas</Link></li>
              <li><Link to="/search?sort=views" className="hover:text-cyan-400 transition-colors">Most Watched</Link></li>
              <li><Link to="/search?sort=latest" className="hover:text-cyan-400 transition-colors">Latest Uploads</Link></li>
            </ul>
          </nav>

          {/* Categories */}
          <nav className="space-y-4" aria-label="Drama categories">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-200 mb-4">Drama Categories</h4>
            <ul className="space-y-3 text-sm">
              <li><Link to="/search?category=K-Drama" className="hover:text-cyan-400 transition-colors">K-Dramas (Korean)</Link></li>
              <li><Link to="/search?category=C-Drama" className="hover:text-cyan-400 transition-colors">C-Dramas (Chinese)</Link></li>
              <li><Link to="/search?category=J-Drama" className="hover:text-cyan-400 transition-colors">J-Dramas (Japanese)</Link></li>
              <li><Link to="/search?category=Pakistani Drama" className="hover:text-cyan-400 transition-colors">Pakistani Dramas</Link></li>
              <li><Link to="/search?category=Turkish Drama" className="hover:text-cyan-400 transition-colors">Turkish Dramas</Link></li>
              <li><Link to="/search?category=Thai Drama" className="hover:text-cyan-400 transition-colors">Thai Dramas (Lakorn)</Link></li>
            </ul>
          </nav>

          {/* App & Legal */}
          <div className="space-y-4" aria-label="App & Security">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-200 mb-4">App & Security</h4>
            <p className="text-sm text-gray-400">
              Install AsianFlix to your home screen for an app-like streaming experience with offline support.
            </p>
            <div className="p-4 rounded-2xl bg-gray-900/80 border border-white/10 backdrop-blur-sm text-sm space-y-3">
              <div className="flex items-center gap-2.5 text-emerald-400 font-medium">
                <Shield className="w-5 h-5 flex-shrink-0" aria-hidden="true" />
                Secure JWT Auth & Privacy
              </div>
              <div className="flex items-center gap-2.5 text-cyan-400 font-medium">
                <Sparkles className="w-5 h-5 flex-shrink-0" aria-hidden="true" />
                PWA Offline Ready
              </div>
              <div className="flex items-center gap-2.5 text-amber-400 font-medium">
                <Download className="w-5 h-5 flex-shrink-0" aria-hidden="true" />
                Installable on All Devices
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="text-sm text-gray-500">
            © {currentYear} AsianFlix. Designed for drama enthusiasts worldwide.
          </div>
          <div className="flex items-center gap-4 text-sm text-gray-500">
            <Link to="/privacy" className="hover:text-cyan-400 transition-colors">Privacy Policy</Link>
            <span aria-hidden="true">•</span>
            <Link to="/terms" className="hover:text-cyan-400 transition-colors">Terms of Service</Link>
            <span aria-hidden="true">•</span>
            <Link to="/cookies" className="hover:text-cyan-400 transition-colors">Cookie Policy</Link>
          </div>
          <div className="flex items-center gap-1.5 text-sm">
            Made with
            <Heart className="w-4 h-4 text-rose-500 fill-rose-500" aria-hidden="true" />
            for Asian Drama lovers.
          </div>
        </div>
      </div>
    </footer>
  );
};