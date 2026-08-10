import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { dramaService } from '../services/dramaService.js';
import { DramaDetailResponse } from '../services/dramaService.js';
import { Episode, Drama } from '../types.js';
import { VideoPlayer } from '../components/drama/VideoPlayer.js';
import { EpisodeList } from '../components/drama/EpisodeList.js';
import { LoadingSpinner } from '../components/common/LoadingSpinner.js';
import { useToast } from '../context/ToastContext.js';
import { ArrowLeft, Film, Bookmark, Star } from 'lucide-react';
import { useAuth } from '../context/AuthContext.js';

export const WatchPage: React.FC = () => {
  const { dramaId, episodeId } = useParams<{ dramaId: string; episodeId: string }>();
  const navigate = useNavigate();
  const { user, toggleWatchlist } = useAuth();
  const { showToast } = useToast();

  const [data, setData] = useState<DramaDetailResponse | null>(null);
  const [currentEp, setCurrentEp] = useState<Episode | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (dramaId) {
      loadDrama(dramaId, episodeId);
    }
  }, [dramaId, episodeId]);

  const loadDrama = async (dId: string, epId?: string) => {
    setLoading(true);
    try {
      const res = await dramaService.getById(dId);
      setData(res);

      if (res.episodes.length > 0) {
        const found = epId ? res.episodes.find((e) => e.id === epId) : res.episodes[0];
        setCurrentEp(found || res.episodes[0]);
      }
    } catch (err: any) {
      showToast(err.message || 'Error loading streaming video', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectEpisode = (ep: Episode) => {
    setCurrentEp(ep);
    navigate(`/watch/${dramaId}/${ep.id}`, { replace: true });
  };

  if (loading) return <LoadingSpinner label="Preparing video player..." />;
  if (!data || !currentEp) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 text-center">
        <Film className="w-12 h-12 text-slate-600 mb-2" />
        <h2 className="text-lg font-bold text-white">No episodes available to stream.</h2>
        <button
          onClick={() => navigate('/')}
          className="mt-4 px-4 py-2 rounded-xl bg-rose-600 text-white font-semibold text-xs"
        >
          Back to Home
        </button>
      </div>
    );
  }

  const { drama, episodes } = data;
  const isSaved = user?.watchlist.includes(drama.id);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pt-20 pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        {/* Back navigation & Title */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate(`/drama/${drama.id}`)}
            className="flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Drama Info
          </button>

          <button
            onClick={() => toggleWatchlist(drama.id)}
            className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all ${
              isSaved
                ? 'bg-rose-500/20 border-rose-500 text-rose-300'
                : 'bg-slate-900 border-slate-800 text-slate-300 hover:text-white'
            }`}
          >
            <Bookmark className={`w-3.5 h-3.5 ${isSaved ? 'fill-rose-400' : ''}`} />
            {isSaved ? 'In Watchlist' : 'Add Watchlist'}
          </button>
        </div>

        {/* Video Player */}
        <VideoPlayer
          drama={drama}
          episode={currentEp}
          allEpisodes={episodes}
          onSelectEpisode={handleSelectEpisode}
        />

        {/* Now Playing Bar */}
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <span className="text-xs font-semibold text-rose-400">
              NOW PLAYING: EPISODE {currentEp.episodeNumber}
            </span>
            <h1 className="text-lg font-bold text-white">{currentEp.title}</h1>
            <p className="text-xs text-slate-400 mt-0.5">{drama.title} ({drama.releaseYear}) • {currentEp.duration}</p>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-amber-400 text-xs font-bold flex items-center gap-1">
              <Star className="w-3.5 h-3.5 fill-amber-400" /> {drama.averageRating.toFixed(1)}
            </span>
          </div>
        </div>

        {/* Episodes Selector List */}
        <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl">
          <EpisodeList
            episodes={episodes}
            currentEpisodeId={currentEp.id}
            onSelectEpisode={handleSelectEpisode}
          />
        </div>
      </div>
    </div>
  );
};
