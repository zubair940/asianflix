import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Drama } from '../../types.js';
import { useAuth } from '../../context/AuthContext.js';
import { Play, Bookmark, Info, Star, Volume2, VolumeX, Sparkles } from 'lucide-react';

interface HeroSectionProps {
  drama: Drama;
}

export const HeroSection: React.FC<HeroSectionProps> = ({ drama }) => {
  const { user, toggleWatchlist } = useAuth();
  const [muted, setMuted] = useState(true);

  const isSaved = user?.watchlist.includes(drama.id);

  return (
    <div className="relative w-full h-[70vh] min-h-[500px] max-h-[700px] overflow-hidden bg-slate-950">
      {/* Background Image */}
      <img
        src={drama.backdrop}
        alt={drama.title}
        className="absolute inset-0 w-full h-full object-cover object-top filter brightness-[0.7]"
      />

      {/* Gradient Overlays for Seamless Blending */}
      <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/50 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/60 to-transparent w-full md:w-3/4" />

      {/* Hero Content */}
      <div className="relative max-w-7xl mx-auto h-full px-4 sm:px-6 lg:px-8 flex flex-col justify-end pb-12 z-10">
        <div className="max-w-2xl space-y-4">
          {/* Badges */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-2.5 py-1 rounded-lg bg-gradient-to-r from-[#00C2FF] to-[#0047FF] text-black text-xs font-bold tracking-wide flex items-center gap-1 shadow-lg shadow-cyan-500/30">
              <Sparkles className="w-3.5 h-3.5 fill-black" /> FEATURED K-DRAMA
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-slate-900/90 backdrop-blur-md border border-white/10 text-amber-400 text-xs font-bold flex items-center gap-1">
              <Star className="w-3.5 h-3.5 fill-amber-400" /> {drama.averageRating.toFixed(1)} Rating
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-slate-900/90 backdrop-blur-md border border-white/10 text-slate-300 text-xs font-semibold">
              {drama.releaseYear}
            </span>
          </div>

          {/* Title EN & KR */}
          <div>
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight drop-shadow-md">
              {drama.title}
            </h1>
            {drama.titleKR && (
              <p className="text-lg sm:text-xl font-medium text-[#00C2FF] font-mono mt-1">
                {drama.titleKR}
              </p>
            )}
          </div>

          {/* Genres & Cast */}
          <div className="flex items-center gap-2 text-xs text-slate-300 flex-wrap">
            <span className="font-semibold text-slate-200">Genres:</span>
            {drama.genre.map((g) => (
              <span key={g} className="px-2 py-0.5 rounded bg-slate-900/80 border border-white/10">
                {g}
              </span>
            ))}
          </div>

          {/* Description */}
          <p className="text-slate-300 text-sm sm:text-base leading-relaxed line-clamp-3 max-w-xl font-normal drop-shadow">
            {drama.description}
          </p>

          {/* Action Buttons */}
          <div className="flex items-center gap-3 pt-2">
            <Link
              to={`/drama/${drama.id}`}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-[#00C2FF] to-[#0047FF] hover:brightness-110 text-black font-extrabold text-sm flex items-center gap-2 shadow-xl shadow-cyan-500/25 hover:scale-105 transition-all"
            >
              <Play className="w-5 h-5 fill-black" /> Watch Episode 1
            </Link>

            <button
              onClick={() => toggleWatchlist(drama.id)}
              className={`px-5 py-3 rounded-xl border text-sm font-semibold flex items-center gap-2 backdrop-blur-md transition-all ${
                isSaved
                  ? 'bg-[#00C2FF]/20 border-[#00C2FF] text-[#00C2FF]'
                  : 'bg-slate-900/90 border-white/10 text-slate-200 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Bookmark className={`w-4 h-4 ${isSaved ? 'fill-[#00C2FF]' : ''}`} />
              {isSaved ? 'In Watchlist' : 'Add Watchlist'}
            </button>

            <Link
              to={`/drama/${drama.id}`}
              className="p-3 rounded-xl bg-slate-900/80 border border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800 backdrop-blur-md transition-all hidden sm:flex"
              title="More Info"
            >
              <Info className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
