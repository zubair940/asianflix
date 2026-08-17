import React, { useState } from 'react';
import { Episode, Drama } from '../../types.js';
import { useAuth } from '../../context/AuthContext.js';
import { useToast } from '../../context/ToastContext.js';
import { dramaService } from '../../services/dramaService.js';
import { EditEpisodeModal } from '../admin/EditEpisodeModal.js';
import { ReplaceVideoModal } from '../admin/ReplaceVideoModal.js';
import { DeleteConfirmModal } from '../admin/DeleteConfirmModal.js';
import { Play, Clock, CheckCircle2, Edit, Video, Trash2 } from 'lucide-react';
import { SmartImage } from '../common/SmartImage.js';

interface EpisodeListProps {
  episodes: Episode[];
  currentEpisodeId?: string;
  dramas?: Drama[];
  onSelectEpisode: (episode: Episode) => void;
  onRefresh?: () => void;
}

export const EpisodeList: React.FC<EpisodeListProps> = ({
  episodes,
  currentEpisodeId,
  dramas = [],
  onSelectEpisode,
  onRefresh
}) => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const isAdmin = user?.role === 'admin';

  const [editingEpisode, setEditingEpisode] = useState<Episode | null>(null);
  const [replacingVideoEp, setReplacingVideoEp] = useState<Episode | null>(null);
  const [deletingEpisode, setDeletingEpisode] = useState<Episode | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const handleConfirmDelete = async () => {
    if (!deletingEpisode) return;
    setDeleteLoading(true);
    try {
      await dramaService.deleteEpisode(deletingEpisode.id);
      showToast(`Episode "${deletingEpisode.title}" deleted`, 'info');
      setDeletingEpisode(null);
      if (onRefresh) onRefresh();
    } catch (err: any) {
      showToast(err.message || 'Error deleting episode', 'error');
    } finally {
      setDeleteLoading(false);
    }
  };

  if (!episodes || episodes.length === 0) {
    return (
      <div className="p-8 text-center bg-slate-900/60 rounded-2xl border border-slate-800 text-slate-400 text-sm">
        No episodes uploaded for this drama yet. Admin can upload episodes from Admin Panel.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h3 className="text-lg font-bold text-white flex items-center justify-between">
        <span>Episodes ({episodes.length})</span>
        <span className="text-xs font-normal text-slate-400">Full HD Stream</span>
      </h3>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {episodes.map((ep) => {
          const isActive = ep.id === currentEpisodeId;
          return (
            <div
              key={ep.id}
              className={`group relative rounded-xl border p-2.5 flex items-center gap-3 transition-all ${
                isActive
                  ? 'bg-rose-950/40 border-rose-500/80 shadow-lg shadow-rose-950/50'
                  : 'bg-slate-900 border-slate-800/80 hover:border-slate-700 hover:bg-slate-800/60'
              }`}
            >
              {/* Thumbnail */}
              <div
                onClick={() => onSelectEpisode(ep)}
                className="relative aspect-video w-24 rounded-lg overflow-hidden shrink-0 bg-slate-800 cursor-pointer"
              >
                <SmartImage
                  src={ep.thumbnail}
                  alt={ep.title}
                  loading="lazy"
                  decoding="async"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                />
                <div className={`absolute inset-0 flex items-center justify-center backdrop-blur-[1px] ${isActive ? 'bg-rose-600/60' : 'bg-slate-950/40 opacity-0 group-hover:opacity-100'} transition-opacity`}>
                  <Play className="w-5 h-5 fill-white text-white" />
                </div>
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div
                  onClick={() => onSelectEpisode(ep)}
                  className="cursor-pointer"
                >
                  <div className="flex items-center justify-between text-[11px] text-slate-400 font-medium mb-0.5">
                    <span className={isActive ? 'text-rose-400 font-bold' : 'text-slate-400'}>
                      EPISODE {ep.episodeNumber}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-500" /> {ep.duration}
                    </span>
                  </div>
                  <h4 className="text-xs font-bold text-slate-100 group-hover:text-rose-400 transition-colors truncate">
                    {ep.title}
                  </h4>

                  {isActive && (
                    <span className="inline-flex items-center gap-1 text-[10px] text-rose-400 font-semibold mt-1">
                      <CheckCircle2 className="w-3 h-3" /> Now Playing
                    </span>
                  )}
                </div>

                {/* Admin Quick Actions */}
                {isAdmin && (
                  <div className="flex items-center gap-1.5 pt-1.5 mt-1 border-t border-slate-800/60">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingEpisode(ep);
                      }}
                      className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                      title="Edit Episode"
                    >
                      <Edit className="w-3 h-3 text-slate-400" /> Edit
                    </button>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setReplacingVideoEp(ep);
                      }}
                      className="px-2 py-0.5 rounded bg-[#00C2FF]/10 hover:bg-[#00C2FF]/20 text-[#00C2FF] text-[10px] font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                      title="Replace Video"
                    >
                      <Video className="w-3 h-3" /> Video
                    </button>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeletingEpisode(ep);
                      }}
                      className="p-1 rounded bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 cursor-pointer transition-colors ml-auto"
                      title="Delete Episode"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Admin Modals */}
      {isAdmin && (
        <>
          <EditEpisodeModal
            isOpen={!!editingEpisode}
            episode={editingEpisode}
            dramas={dramas}
            onSuccess={() => {
              setEditingEpisode(null);
              if (onRefresh) onRefresh();
            }}
            onCancel={() => setEditingEpisode(null)}
          />

          <ReplaceVideoModal
            isOpen={!!replacingVideoEp}
            episode={replacingVideoEp}
            onSuccess={() => {
              setReplacingVideoEp(null);
              if (onRefresh) onRefresh();
            }}
            onCancel={() => setReplacingVideoEp(null)}
          />

          <DeleteConfirmModal
            isOpen={!!deletingEpisode}
            title={deletingEpisode ? `Ep ${deletingEpisode.episodeNumber}: ${deletingEpisode.title}` : ''}
            loading={deleteLoading}
            onConfirm={handleConfirmDelete}
            onCancel={() => setDeletingEpisode(null)}
          />
        </>
      )}
    </div>
  );
};

