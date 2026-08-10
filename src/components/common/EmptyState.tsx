import React from 'react';
import { Link } from 'react-router-dom';
import { Film, Plus, ShieldCheck, Sparkles, Tv, Search } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.js';

interface EmptyStateProps {
  icon?: 'film' | 'search' | 'sparkles' | 'tv';
  title?: string;
  description?: string;
  actionText?: string;
  actionLink?: string;
  onActionClick?: () => void;
  showAdminPrompt?: boolean;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon = 'film',
  title = 'No K-Dramas Available Yet',
  description = 'Our catalog is currently empty. The administrator has not uploaded any dramas or episodes yet.',
  actionText,
  actionLink,
  onActionClick,
  showAdminPrompt = true
}) => {
  const { user, isAdmin } = useAuth();

  const renderIcon = () => {
    switch (icon) {
      case 'search':
        return <Search className="w-10 h-10 text-[#00C2FF]" />;
      case 'sparkles':
        return <Sparkles className="w-10 h-10 text-[#00C2FF]" />;
      case 'tv':
        return <Tv className="w-10 h-10 text-[#00C2FF]" />;
      default:
        return <Film className="w-10 h-10 text-[#00C2FF]" />;
    }
  };

  return (
    <div className="w-full py-16 px-4 flex flex-col items-center justify-center text-center my-6">
      <div className="relative mb-6 group">
        <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-slate-900 to-slate-950 border border-white/10 flex items-center justify-center shadow-2xl shadow-cyan-500/10 group-hover:border-[#00C2FF]/50 transition-all duration-300">
          {renderIcon()}
        </div>
        <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-[#00C2FF] flex items-center justify-center text-black shadow-lg">
          <Sparkles className="w-4 h-4 fill-black" />
        </div>
      </div>

      <h3 className="text-xl sm:text-2xl font-bold text-white tracking-tight mb-2">
        {title}
      </h3>

      <p className="max-w-md text-xs sm:text-sm text-slate-400 leading-relaxed mb-6">
        {description}
      </p>

      {/* Admin Quick Call To Action */}
      {isAdmin ? (
        <div className="p-4 rounded-2xl bg-slate-900/90 border border-[#00C2FF]/30 backdrop-blur-md max-w-sm w-full space-y-3 mb-4 shadow-xl">
          <div className="flex items-center justify-center gap-2 text-xs font-bold text-[#00C2FF]">
            <ShieldCheck className="w-4 h-4 text-[#00C2FF]" />
            <span>Admin Privileges Detected</span>
          </div>
          <p className="text-[11px] text-slate-300">
            Be the first to populate KDramaBox! Upload a drama with titles, posters, and video stream links.
          </p>
          <Link
            to="/admin"
            className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-[#00C2FF] to-[#0047FF] hover:brightness-110 text-black font-extrabold text-xs flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20 transition-all"
          >
            <Plus className="w-4 h-4" /> Upload First Drama
          </Link>
        </div>
      ) : showAdminPrompt && !user ? (
        <div className="text-xs text-slate-500 flex items-center gap-1.5 mb-4">
          <span>Are you the site owner?</span>
          <Link to="/login" className="text-[#00C2FF] font-semibold hover:underline">
            Sign in as Admin
          </Link>
        </div>
      ) : null}

      {actionText && (actionLink || onActionClick) && (
        <div>
          {actionLink ? (
            <Link
              to={actionLink}
              className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs border border-white/10 transition-all inline-flex items-center gap-2"
            >
              {actionText}
            </Link>
          ) : (
            <button
              onClick={onActionClick}
              className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs border border-white/10 transition-all inline-flex items-center gap-2"
            >
              {actionText}
            </button>
          )}
        </div>
      )}
    </div>
  );
};
