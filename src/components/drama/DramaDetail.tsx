import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { dramaService } from '../../services/dramaService.js';
import { DramaDetailResponse } from '../../services/dramaService.js';
import { EpisodeList } from './EpisodeList.js';
import { ReviewSection } from './ReviewSection.js';
import { DramaRow } from '../homepage/DramaRow.js';
import { LoadingSpinner } from '../common/LoadingSpinner.js';
import { EditDramaModal } from '../admin/EditDramaModal.js';
import { ReorderEpisodesModal } from '../admin/ReorderEpisodesModal.js';
import { AddEpisode } from '../admin/AddEpisode.js';
import { ActorBioModal } from './ActorBioModal.js';
import { useAuth } from '../../context/AuthContext.js';
import { useToast } from '../../context/ToastContext.js';
import { formatViews } from '../../utils/helpers.js';
import {
  Star,
  Play,
  Bookmark,
  Share2,
  Calendar,
  User,
  Film,
  Check,
  Copy,
  Layers,
  Sparkles,
  Edit3,
  ListOrdered,
  Plus,
  Trash2
} from 'lucide-react';

export const DramaDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, toggleWatchlist } = useAuth();
  const { showToast } = useToast();

  const [data, setData] = useState<DramaDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  // Admin Modals
  const [selectedActor, setSelectedActor] = useState<string | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showReorderModal, setShowReorderModal] = useState(false);
  const [showAddEpModal, setShowAddEpModal] = useState(false);

  useEffect(() => {
    if (id) {
      loadDramaDetail(id);
    }
  }, [id]);

  const loadDramaDetail = async (dramaId: string) => {
    setLoading(true);
    try {
      const res = await dramaService.getById(dramaId);
      setData(res);
    } catch (err: any) {
      showToast(err.message || 'Drama not found', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Warm the connection to media hosts (Vercel Blob / R2 / external CDNs) as
  // soon as the drama loads. When the user clicks an episode, the browser no
  // longer pays DNS+TLS+connection setup before the first video bytes arrive —
  // playback starts immediately instead of buffering on a cold connection.
  useEffect(() => {
    if (!data) return;
    const origins = new Set<string>();
    const collect = (url?: string) => {
      if (!url) return;
      try {
        const u = new URL(url, window.location.origin);
        if (u.origin !== window.location.origin) origins.add(u.origin);
      } catch {
        /* ignore malformed URLs */
      }
    };

    data.episodes.forEach((ep) => {
      collect(ep.videoUrl);
      collect(ep.thumbnail);
    });
    collect(data.drama.poster);
    collect(data.drama.backdrop);

    origins.forEach((origin) => {
      if (document.querySelector(`link[rel="preconnect"][href="${origin}"]`)) return;
      const link = document.createElement('link');
      link.rel = 'preconnect';
      link.href = origin;
      document.head.appendChild(link);
    });
  }, [data]);

  const handleDeleteDrama = async () => {
    if (!data) return;
    if (!confirm(`Are you sure you want to permanently delete "${data.drama.title}" and all its episodes?`)) return;
    try {
      await dramaService.deleteDrama(data.drama.id);
      showToast(`Drama "${data.drama.title}" deleted`, 'info');
      navigate('/');
    } catch (err: any) {
      showToast(err.message || 'Error deleting drama', 'error');
    }
  };

  const handleShare = (platform?: string) => {
    const url = window.location.href;
    const text = `Check out "${data?.drama.title}" on KDramaBox!`;

    if (platform === 'whatsapp') {
      window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text + ' ' + url)}`, '_blank');
    } else if (platform === 'twitter') {
      window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`, '_blank');
    } else {
      navigator.clipboard.writeText(url);
      setCopied(true);
      showToast('Link copied to clipboard!', 'success');
      setTimeout(() => setCopied(false), 3000);
    }
  };

  const isSaved = data ? user?.watchlist.includes(data.drama.id) : false;

  if (loading) return <LoadingSpinner label="Loading K-Drama details & episodes..." />;
  if (!data) return <div className="text-center py-20 text-slate-400">Drama not found.</div>;

  const { drama, episodes, reviews, related } = data;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-20 pt-16">
      {/* Celebrity Actor Profile Modal */}
      {selectedActor && (
        <ActorBioModal
          actorName={selectedActor}
          dramas={related.concat(drama)}
          isOpen={!!selectedActor}
          onClose={() => setSelectedActor(null)}
        />
      )}
      {/* Admin Edit Drama Modal */}
      {showEditModal && (
        <EditDramaModal
          isOpen={showEditModal}
          drama={drama}
          onSuccess={() => {
            setShowEditModal(false);
            if (id) loadDramaDetail(id);
          }}
          onCancel={() => setShowEditModal(false)}
        />
      )}

      {/* Admin Reorder Episodes Modal */}
      {showReorderModal && (
        <ReorderEpisodesModal
          isOpen={showReorderModal}
          dramaId={drama.id}
          dramas={[drama]}
          onSuccess={() => {
            setShowReorderModal(false);
            if (id) loadDramaDetail(id);
          }}
          onCancel={() => setShowReorderModal(false)}
        />
      )}

      {/* Admin Add Episode Modal */}
      {showAddEpModal && (
        <AddEpisode
          dramas={[drama]}
          preselectedDramaId={drama.id}
          onSuccess={() => {
            setShowAddEpModal(false);
            if (id) loadDramaDetail(id);
          }}
          onCancel={() => setShowAddEpModal(false)}
        />
      )}

      {/* Hero Backdrop Banner */}
      <div className="relative w-full h-[55vh] min-h-[400px] overflow-hidden bg-slate-950">
        <img
          src={drama.backdrop || drama.poster}
          alt={drama.title}
          className="w-full h-full object-cover filter brightness-50"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-transparent" />
      </div>

      {/* Main Content Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-40 relative z-20 space-y-12">
        {/* Header Grid: Poster + Info */}
        <div className="flex flex-col md:flex-row gap-8 items-start">
          {/* Poster Image */}
          <div className="w-56 sm:w-64 shrink-0 rounded-2xl overflow-hidden shadow-2xl border-2 border-slate-800 bg-slate-900 mx-auto md:mx-0">
            <img src={drama.poster} alt={drama.title} className="w-full aspect-[2/3] object-cover" />
          </div>

          {/* Details Column */}
          <div className="flex-1 space-y-4 text-center md:text-left">
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
              <span className="px-2.5 py-1 rounded-lg bg-rose-600 text-white text-xs font-bold flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" /> HD 1080p
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-amber-400 text-xs font-bold flex items-center gap-1">
                <Star className="w-3.5 h-3.5 fill-amber-400" /> {drama.averageRating.toFixed(1)} ({drama.totalRatingsCount} ratings)
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 text-xs font-semibold">
                {drama.releaseYear}
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 text-xs font-semibold">
                {formatViews(drama.views)} views
              </span>
            </div>

            <div>
              <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight">{drama.title}</h1>
              {drama.titleKR && <p className="text-xl font-medium text-rose-400 font-mono mt-1">{drama.titleKR}</p>}
            </div>

            {/* Cast & Director */}
            <div className="space-y-1 text-xs text-slate-300">
              <p>
                <span className="font-semibold text-slate-400">Cast: </span>
                {drama.cast.map((actor, idx) => (
                  <span key={actor}>
                    <button
                      onClick={() => setSelectedActor(actor)}
                      className="text-[#00C2FF] hover:underline font-bold transition-all cursor-pointer"
                    >
                      {actor}
                    </button>
                    {idx < drama.cast.length - 1 ? ', ' : ''}
                  </span>
                ))}
              </p>
              <p>
                <span className="font-semibold text-slate-400">Director: </span>
                {drama.director}
              </p>
              <div className="flex flex-wrap gap-1.5 pt-1 justify-center md:justify-start">
                {drama.genre.map((g) => (
                  <span key={g} className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-xs text-rose-300 font-medium">
                    {g}
                  </span>
                ))}
              </div>
            </div>

            {/* Description */}
            <p className="text-sm text-slate-300 leading-relaxed max-w-3xl">{drama.description}</p>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 pt-2">
              {episodes.length > 0 && (
                <Link
                  to={`/watch/${drama.id}/${episodes[0].id}`}
                  className="px-6 py-3 rounded-xl bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 text-white font-bold text-sm flex items-center gap-2 shadow-xl shadow-rose-600/30 transition-all hover:scale-105"
                >
                  <Play className="w-5 h-5 fill-white" /> Start Watching Ep 1
                </Link>
              )}

              <button
                onClick={() => toggleWatchlist(drama.id)}
                className={`px-5 py-3 rounded-xl border text-sm font-semibold flex items-center gap-2 transition-all ${
                  isSaved
                    ? 'bg-rose-500/20 border-rose-500 text-rose-300'
                    : 'bg-slate-900 border-slate-700 text-slate-200 hover:bg-slate-800'
                }`}
              >
                <Bookmark className={`w-4 h-4 ${isSaved ? 'fill-rose-400' : ''}`} />
                {isSaved ? 'In Watchlist' : 'Add to Watchlist'}
              </button>

              {/* Admin Quick Action Controls */}
              {user?.role === 'admin' && (
                <div className="flex flex-wrap items-center gap-2 border-l border-slate-800 pl-3">
                  <button
                    onClick={() => setShowEditModal(true)}
                    className="px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-amber-400 hover:bg-slate-800 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    <Edit3 className="w-3.5 h-3.5" /> Edit Details
                  </button>

                  <button
                    onClick={() => setShowReorderModal(true)}
                    className="px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-[#00C2FF] hover:bg-slate-800 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    <ListOrdered className="w-3.5 h-3.5" /> Reorder Ep
                  </button>

                  <button
                    onClick={() => setShowAddEpModal(true)}
                    className="px-3.5 py-2.5 rounded-xl bg-rose-600/20 border border-rose-500/30 text-rose-300 hover:bg-rose-600/30 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Ep
                  </button>

                  <button
                    onClick={handleDeleteDrama}
                    className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 hover:bg-rose-500/20 transition-all cursor-pointer"
                    title="Delete Drama"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {/* Social Share Buttons */}
              <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-900 border border-slate-800">
                <button
                  onClick={() => handleShare('whatsapp')}
                  className="px-2.5 py-1.5 text-xs text-emerald-400 hover:bg-slate-800 rounded-lg font-semibold"
                >
                  WhatsApp
                </button>
                <button
                  onClick={() => handleShare('twitter')}
                  className="px-2.5 py-1.5 text-xs text-sky-400 hover:bg-slate-800 rounded-lg font-semibold"
                >
                  Twitter
                </button>
                <button
                  onClick={() => handleShare('copy')}
                  className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg"
                  title="Copy link"
                >
                  {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Episode Picker Section */}
        <div className="p-6 rounded-3xl bg-slate-900/90 border border-slate-800/80 shadow-xl">
          <EpisodeList
            episodes={episodes}
            onSelectEpisode={(ep) => navigate(`/watch/${drama.id}/${ep.id}`)}
          />
        </div>

        {/* User Reviews Section */}
        <div className="p-6 rounded-3xl bg-slate-900/90 border border-slate-800/80 shadow-xl">
          <ReviewSection
            dramaId={drama.id}
            reviews={reviews}
            onReviewAdded={() => loadDramaDetail(drama.id)}
          />
        </div>

        {/* Related Dramas */}
        {related.length > 0 && (
          <DramaRow
            title="More Like This"
            subtitle={`Popular dramas in ${drama.genre[0]}`}
            dramas={related}
          />
        )}
      </div>
    </div>
  );
};
