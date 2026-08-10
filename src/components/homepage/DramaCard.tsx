import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Drama, WatchHistoryItem } from '../../types.js';
import { useAuth } from '../../context/AuthContext.js';
import { formatViews } from '../../utils/helpers.js';
import { Star, Play, Bookmark, Eye } from 'lucide-react';

interface DramaCardProps {
  drama: Drama;
  historyItem?: WatchHistoryItem;
}

export const DramaCard: React.FC<DramaCardProps> = ({ drama, historyItem }) => {
  const { user, toggleWatchlist } = useAuth();
  const navigate = useNavigate();

  const isSaved = user?.watchlist.includes(drama.id);

  const handleWatchlistClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleWatchlist(drama.id);
  };

  const progressPercent = historyItem && historyItem.duration > 0
    ? Math.min(100, Math.round((historyItem.progress / historyItem.duration) * 100))
    : 0;

  return (
    <div className="group relative rounded-xl bg-slate-900/90 border border-white/10 hover:border-[#00C2FF]/60 overflow-hidden shadow-lg transition-all duration-300 hover:-translate-y-1.5 hover:shadow-2xl hover:shadow-cyan-500/10 flex flex-col h-full">
      {/* Poster Image & Hover Overlay */}
      <div className="relative aspect-[2/3] w-full overflow-hidden bg-slate-800">
        <img
          src={drama.poster}
          alt={drama.title}
          loading="lazy"
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />

        {/* Gradient Mask */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-[#050505]/20 to-transparent opacity-80 group-hover:opacity-90 transition-opacity" />

        {/* Rating Badge Top Left */}
        <div className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-lg bg-[#050505]/80 backdrop-blur-md border border-white/10 text-[11px] font-semibold text-amber-400 flex items-center gap-1">
          <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
          {drama.averageRating.toFixed(1)}
        </div>

        {/* Watchlist Toggle Top Right */}
        <button
          onClick={handleWatchlistClick}
          title={isSaved ? 'Remove from Watchlist' : 'Add to Watchlist'}
          className={`absolute top-2.5 right-2.5 p-2 rounded-xl backdrop-blur-md border transition-all ${
            isSaved
              ? 'bg-[#00C2FF] border-[#00C2FF] text-black shadow-lg shadow-cyan-500/40'
              : 'bg-[#050505]/70 border-white/10 text-slate-300 hover:text-black hover:bg-[#00C2FF] hover:border-[#00C2FF]'
          }`}
        >
          <Bookmark className={`w-3.5 h-3.5 ${isSaved ? 'fill-black' : ''}`} />
        </button>

        {/* Center Play Button on Hover */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-[#050505]/40 backdrop-blur-[2px]">
          <Link
            to={`/drama/${drama.id}`}
            className="w-12 h-12 rounded-full bg-gradient-to-br from-[#00C2FF] to-[#0047FF] text-black flex items-center justify-center shadow-xl shadow-cyan-500/50 hover:scale-110 transition-transform"
          >
            <Play className="w-6 h-6 ml-0.5 fill-black" />
          </Link>
        </div>

        {/* Watch Progress Bar if in Continue Watching */}
        {progressPercent > 0 && (
          <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-slate-800">
            <div
              className="h-full bg-gradient-to-r from-[#00C2FF] to-[#0047FF] rounded-r-full"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        )}
      </div>

      {/* Card Info */}
      <div className="p-3.5 flex flex-col flex-1 justify-between">
        <div>
          <div className="flex items-center gap-1.5 text-[10px] font-medium text-[#00C2FF] mb-1">
            <span className="px-1.5 py-0.2 rounded bg-[#00C2FF]/10 border border-[#00C2FF]/30 text-[#00C2FF] font-bold">
              {drama.category || 'K-Drama'}
            </span>
            <span>•</span>
            <span>{drama.releaseYear}</span>
            <span>•</span>
            <span className="truncate">{drama.genre.slice(0, 2).join(', ')}</span>
          </div>
          <Link to={`/drama/${drama.id}`}>
            <h3 className="text-sm font-bold text-slate-100 group-hover:text-[#00C2FF] transition-colors line-clamp-1">
              {drama.title}
            </h3>
          </Link>
          {drama.titleKR && (
            <p className="text-[11px] text-slate-400 font-mono mt-0.5 line-clamp-1">
              {drama.titleKR}
            </p>
          )}
        </div>

        <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
          <span className="flex items-center gap-1">
            <Eye className="w-3 h-3 text-slate-400" />
            {formatViews(drama.views)} views
          </span>
          <span className="text-[10px] text-slate-400 font-medium px-1.5 py-0.5 bg-slate-800/60 rounded">
            HD 1080p
          </span>
        </div>
      </div>
    </div>
  );
};
