import React, { memo, useState, useCallback, useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Drama } from '../../types.js';
import { useAuth } from '../../context/AuthContext.js';
import { Play, Bookmark, Info, Star, Sparkles, Volume2, VolumeX, ChevronRight } from 'lucide-react';
import { SmartImage } from '../common/SmartImage.js';

interface HeroSectionProps {
  drama: Drama;
}

const HeroSection = memo(function HeroSection({ drama }: HeroSectionProps) {
  const { user, toggleWatchlist } = useAuth();
  const [muted, setMuted] = useState(true);
  const [hovering, setHovering] = useState(false);

  const isSaved = useMemo(() => user?.watchlist.includes(drama.id) ?? false, [user?.watchlist, drama.id]);

  // Preload the hero backdrop so the browser starts fetching it before the
  // rest of the page parses — the LCP element arrives as fast as possible.
  useEffect(() => {
    if (!drama.backdrop) return;
    const href = drama.backdrop;
    const existing = document.querySelector(`link[rel="preload"][as="image"][href="${href}"]`);
    if (!existing) {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'image';
      link.fetchPriority = 'high';
      link.href = href;
      document.head.appendChild(link);
    }
    return () => {
      const link = document.querySelector(`link[rel="preload"][as="image"][href="${href}"]`);
      if (link && link.parentNode) link.parentNode.removeChild(link);
    };
  }, [drama.backdrop]);

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
    <section
      className="hero relative w-full h-[75vh] min-h-[550px] max-h-[800px] overflow-hidden bg-gray-950"
      aria-labelledby="hero-title"
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
    >
      {/* Background Image */}
      <div className="absolute inset-0 z-0" aria-hidden="true">
        <SmartImage
          src={drama.backdrop}
          alt=""
          loading="eager"
          fetchPriority="high"
          decoding="async"
          className="absolute inset-0 w-full h-full object-cover object-top filter brightness-[0.6] transition-transform duration-700 group-hover:scale-105"
        />
        {/* Gradient Overlays */}
        <div className="absolute inset-0 bg-gradient-to-t from-gray-950 via-gray-950/40 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-gray-950 via-gray-950/60 to-transparent w-full md:w-3/4" />
        {/* Subtle noise texture */}
        <div className="absolute inset-0 bg-grid-pattern opacity-[0.03]" />
      </div>

      {/* Hero Content */}
      <div className="relative z-10 max-w-7xl mx-auto h-full px-4 sm:px-6 lg:px-8 flex flex-col justify-end pb-14">
        <div className="max-w-3xl animate-slide-up">
          {/* Badges Row */}
          <div className="flex flex-wrap items-center gap-2 mb-4" role="list" aria-label="Drama badges">
            <span className="badge badge-primary flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 fill-current" aria-hidden="true" />
              FEATURED DRAMA
            </span>
            <span className="badge badge-amber flex items-center gap-1">
              <Star className="w-3 h-3 fill-current" aria-hidden="true" />
              {drama.averageRating.toFixed(1)} Rating
            </span>
            <span className="badge badge-outline">
              {drama.releaseYear}
            </span>
            <span className="badge badge-violet">
              {drama.category || 'K-Drama'}
            </span>
          </div>

          {/* Title EN & KR */}
          <div className="mb-4">
            <h1 id="hero-title" className="text-4xl sm:text-6xl lg:text-7xl font-black text-white tracking-tight drop-shadow-[0_4px_20px_rgba(0,0,0,0.5)] leading-tight">
              {drama.title}
            </h1>
            {drama.titleKR && (
              <p className="text-lg sm:text-xl font-medium text-cyan-400 font-mono mt-2 drop-shadow-sm">
                {drama.titleKR}
              </p>
            )}
          </div>

          {/* Meta Info */}
          <div className="flex flex-wrap items-center gap-3 text-sm text-gray-300 mb-5" aria-label="Drama metadata">
            <span className="flex items-center gap-1.5">
              <span className="text-cyan-400 font-semibold">Genres:</span>
              {drama.genre.map((g, i) => (
                <span key={g} className="px-2.5 py-1 rounded-full bg-gray-900/80 border border-white/10 text-xs backdrop-blur-sm">
                  {g}
                </span>
              ))}
            </span>
            <span className="flex items-center gap-1.5 text-gray-500">
              <span className="px-2.5 py-1 rounded-full bg-gray-900/80 border border-white/10 text-xs">
                {drama.releaseYear}
              </span>
            </span>
            <span className="flex items-center gap-1.5 text-gray-500">
              <span className="px-2.5 py-1 rounded-full bg-gray-900/80 border border-white/10 text-xs">
                HD 1080p
              </span>
            </span>
          </div>

          {/* Description */}
          <p className="text-gray-300 text-base sm:text-lg leading-relaxed line-clamp-4 max-w-2xl mb-6 drop-shadow-sm">
            {drama.description}
          </p>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-3">
            <Link
              to={dramaUrl}
              className="group btn-primary px-7 py-3.5 text-base flex items-center gap-2.5 shadow-xl shadow-cyan-500/30 hover:scale-105"
              aria-label={`Watch ${drama.title} - Episode 1`}
            >
              <Play className="w-5.5 h-5.5 fill-current group-hover:translate-x-1 transition-transform" aria-hidden="true" />
              <span>Watch Episode 1</span>
              <ChevronRight className="w-5 h-5 fill-current group-hover:translate-x-1 transition-transform" aria-hidden="true" />
            </Link>

            <button
              onClick={handleWatchlistClick}
              className={`btn px-6 py-3.5 text-base flex items-center gap-2.5 backdrop-blur-md transition-all ${
                isSaved
                  ? 'bg-cyan-400/20 border-cyan-400/50 text-cyan-400 hover:bg-cyan-400/30 hover:border-cyan-400'
                  : 'bg-gray-900/80 border-white/10 text-gray-200 hover:bg-gray-800 hover:border-white/20 hover:text-white'
              }`}
              aria-label={isSaved ? `Remove ${drama.title} from watchlist` : `Add ${drama.title} to watchlist`}
              aria-pressed={isSaved}
            >
              <Bookmark className={`w-5 h-5 ${isSaved ? 'fill-current' : ''}`} aria-hidden="true" />
              <span>{isSaved ? 'In Watchlist' : 'Add Watchlist'}</span>
            </button>

            <Link
              to={dramaUrl}
              className="btn p-3.5 rounded-xl bg-gray-900/80 border border-white/10 text-gray-300 hover:text-white hover:bg-gray-800 hover:border-white/20 backdrop-blur-md transition-all"
              title="More Info"
              aria-label={`More info about ${drama.title}`}
            >
              <Info className="w-5.5 h-5.5" aria-hidden="true" />
            </Link>

            {/* Volume Toggle */}
            <button
              onClick={() => setMuted(!muted)}
              className="btn p-3.5 rounded-xl bg-gray-900/80 border border-white/10 text-gray-300 hover:text-white hover:bg-gray-800 hover:border-white/20 backdrop-blur-md transition-all"
              title={muted ? 'Unmute preview' : 'Mute preview'}
              aria-label={muted ? 'Unmute' : 'Mute'}
              aria-pressed={!muted}
            >
              {muted ? (
                <VolumeX className="w-5.5 h-5.5 text-rose-400" aria-hidden="true" />
              ) : (
                <Volume2 className="w-5.5 h-5.5 text-cyan-400" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 animate-bounce z-10" aria-hidden="true">
        <div className="w-6 h-10 rounded-full border-2 border-white/30 flex justify-center pt-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-white/60 animate-bounce" style={{ animationDelay: '0.5s' }} />
        </div>
      </div>
    </section>
  );
});

HeroSection.displayName = 'HeroSection';

export { HeroSection };