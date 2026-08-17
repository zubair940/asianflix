import React, { memo, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Drama, WatchHistoryItem } from '../../types.js';
import { useAuth } from '../../context/AuthContext.js';
import { formatViews } from '../../utils/helpers.js';
import { Star, Play, Bookmark, Eye } from 'lucide-react';
import { SmartImage } from '../common/SmartImage.js';

interface DramaCardProps {
  drama: Drama;
  historyItem?: WatchHistoryItem;
}

const DramaCard = memo(function DramaCard({ drama, historyItem }: DramaCardProps) {
  const { user, toggleWatchlist } = useAuth();

  const isSaved = useMemo(
    () => user?.watchlist.includes(drama.id) ?? false,
    [user?.watchlist, drama.id]
  );

  const progressPercent = useMemo(() => {
    if (!historyItem || historyItem.duration <= 0) return 0;
    return Math.min(100, Math.round((historyItem.progress / historyItem.duration) * 100));
  }, [historyItem]);

  const handleWatchlistClick = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      toggleWatchlist(drama.id);
    },
    [drama.id, toggleWatchlist]
  );

  const dramaUrl = `/drama/${drama.id}`;

  return (
    <article className="group relative card-interactive aspect-[2/3] flex flex-col overflow-hidden" aria-label={drama.title}>
      {/* Poster Image & Hover Overlay */}
      <div className="relative flex-1 w-full overflow-hidden bg-gray-900">
        <SmartImage
          src={drama.poster}
          alt=""
          loading="lazy"
          decoding="async"
          fetchPriority="low"
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />

        {/* Gradient Mask */}
        <div className="absolute inset-0 bg-gradient-to-t from-gray-950 via-gray-950/20 to-transparent opacity-80 group-hover:opacity-90 transition-opacity duration-300" aria-hidden="true" />

        {/* Rating Badge Top Left */}
        <div className="absolute top-2 left-2 badge badge-amber flex items-center gap-1">
          <Star className="w-3 h-3 fill-current" aria-hidden="true" />
          <span>{drama.averageRating.toFixed(1)}</span>
        </div>

        {/* Watchlist Toggle Top Right */}
        <button
          onClick={handleWatchlistClick}
          title={isSaved ? 'Remove from Watchlist' : 'Add to Watchlist'}
          className={`absolute top-2 right-2 p-2 rounded-xl backdrop-blur-md border transition-all duration-200 ${
            isSaved
              ? 'bg-cyan-400 border-cyan-400 text-gray-950 shadow-lg shadow-cyan-500/40'
              : 'bg-gray-950/70 border-white/10 text-gray-300 hover:text-gray-950 hover:bg-cyan-400 hover:border-cyan-400'
          }`}
          aria-label={isSaved ? 'Remove from watchlist' : 'Add to watchlist'}
          aria-pressed={isSaved}
        >
          <Bookmark className={`w-4 h-4 ${isSaved ? 'fill-current' : ''}`} aria-hidden="true" />
        </button>

        {/* Center Play Button on Hover */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gray-950/40 backdrop-blur-sm" aria-hidden="true">
          <Link
            to={dramaUrl}
            className="w-14 h-14 rounded-full bg-gradient-to-br from-cyan-400 to-blue-600 text-gray-950 flex items-center justify-center shadow-xl shadow-cyan-500/50 hover:scale-110 transition-transform duration-300 focus-visible:opacity-100 focus-visible:scale-110"
            aria-label={`Watch ${drama.title}`}
          >
            <Play className="w-7 h-7 ml-0.5 fill-current" aria-hidden="true" />
          </Link>
        </div>

        {/* Watch Progress Bar */}
        {progressPercent > 0 && (
          <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-gray-800" role="progressbar" aria-valuenow={progressPercent} aria-valuemin={0} aria-valuemax={100} aria-label={`Watch progress: ${progressPercent}%`}>
            <div
              className="h-full bg-gradient-to-r from-cyan-400 to-blue-600 rounded-r-full transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        )}

        {/* Category Badge Bottom Left */}
        <div className="absolute bottom-2 left-2 badge badge-primary text-xs">
          {drama.category || 'K-Drama'}
        </div>
      </div>

      {/* Card Info */}
      <div className="p-3.5 flex flex-col flex-1 justify-between bg-gray-950/50">
        <div className="min-h-[60px]">
          <Link to={dramaUrl} className="block" aria-label={`View ${drama.title} details`}>
            <h3 className="text-sm font-bold text-white group-hover:text-cyan-400 transition-colors duration-200 line-clamp-1">
              {drama.title}
            </h3>
          </Link>
          {drama.titleKR && (
            <p className="text-[11px] text-gray-500 font-mono mt-1 line-clamp-1" aria-hidden="true">
              {drama.titleKR}
            </p>
          )}
          <div className="flex items-center gap-1.5 text-[10px] font-medium text-gray-400 mt-2">
            <span>{drama.releaseYear}</span>
            <span aria-hidden="true">•</span>
            <span className="truncate max-w-[100px]">{drama.genre.slice(0, 2).join(', ')}</span>
          </div>
        </div>

        <div className="mt-3 pt-2.5 border-t border-white/5 flex items-center justify-between text-[11px] text-gray-500">
          <span className="flex items-center gap-1">
            <Eye className="w-3.5 h-3.5 text-gray-500" aria-hidden="true" />
            <span>{formatViews(drama.views)} views</span>
          </span>
          <span className="badge badge-outline text-[10px]">HD 1080p</span>
        </div>
      </div>
    </article>
  );
});

DramaCard.displayName = 'DramaCard';

export { DramaCard };