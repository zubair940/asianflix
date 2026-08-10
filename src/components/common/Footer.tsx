import React from 'react';
import { Link } from 'react-router-dom';
import { Film, Heart, Sparkles, Globe, Shield, Tv, Download } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-[#050505] border-t border-white/10 text-slate-400 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
        {/* Col 1 */}
        <div className="space-y-4">
          <div className="flex items-center gap-2.5">
            <img
              src="/logo.svg"
              alt="AsianFlix Logo"
              className="w-8 h-8 rounded-lg object-contain border border-slate-700/50 shadow-sm"
            />
            <span className="text-lg font-bold text-white">
              Asian<span className="text-[#00C2FF]">Flix</span>
            </span>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            The ultimate high-definition Asian Drama streaming hub. Watch your favorite K-Dramas, C-Dramas, Pakistani Dramas, Turkish Dramas, J-Dramas & more with multi-language subtitles across devices.
          </p>
          <div className="flex items-center gap-3 text-xs text-slate-500">
            <span className="flex items-center gap-1"><Tv className="w-3.5 h-3.5 text-[#00C2FF]" /> Full HD 1080p</span>
            <span className="flex items-center gap-1"><Globe className="w-3.5 h-3.5 text-cyan-400" /> Multi-Subs</span>
          </div>
        </div>

        {/* Col 2 */}
        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-200 mb-3">
            Quick Navigation
          </h4>
          <ul className="space-y-2 text-xs">
            <li>
              <Link to="/" className="hover:text-[#00C2FF] transition-colors">Home & Trending</Link>
            </li>
            <li>
              <Link to="/search" className="hover:text-[#00C2FF] transition-colors">Genre & Category Discovery</Link>
            </li>
            <li>
              <Link to="/profile" className="hover:text-[#00C2FF] transition-colors">My Watchlist</Link>
            </li>
            <li>
              <Link to="/search?sort=rating" className="hover:text-[#00C2FF] transition-colors">Top Rated Dramas</Link>
            </li>
          </ul>
        </div>

        {/* Col 3 */}
        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-200 mb-3">
            Drama Categories
          </h4>
          <ul className="space-y-2 text-xs">
            <li><Link to="/search?category=K-Drama" className="hover:text-[#00C2FF] transition-colors">K-Dramas (Korean)</Link></li>
            <li><Link to="/search?category=C-Drama" className="hover:text-[#00C2FF] transition-colors">C-Dramas (Chinese)</Link></li>
            <li><Link to="/search?category=Pakistani Drama" className="hover:text-[#00C2FF] transition-colors">Pakistani Dramas</Link></li>
            <li><Link to="/search?category=Turkish Drama" className="hover:text-[#00C2FF] transition-colors">Turkish Dramas</Link></li>
          </ul>
        </div>

        {/* Col 4 */}
        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-200 mb-3">
            App & Security
          </h4>
          <p className="text-xs text-slate-400 mb-3">
            Install AsianFlix to your home screen for an app-like streaming experience.
          </p>
          <div className="p-3 rounded-xl bg-slate-900 border border-white/10 text-xs space-y-2">
            <div className="flex items-center gap-2 text-emerald-400 font-medium">
              <Shield className="w-4 h-4" /> Secure JWT Auth & Privacy
            </div>
            <div className="flex items-center gap-2 text-[#00C2FF] font-medium">
              <Sparkles className="w-4 h-4" /> PWA Offline Ready
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 border-t border-white/10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
        <div>
          © {new Date().getFullYear()} AsianFlix. Designed for drama enthusiasts worldwide.
        </div>
        <div className="flex items-center gap-1">
          Made with <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" /> for Asian Drama lovers.
        </div>
      </div>
    </footer>
  );
};
