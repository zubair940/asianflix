import React, { useState, useEffect, useMemo } from 'react';
import { Episode, Drama } from '../../types.js';
import { dramaService } from '../../services/dramaService.js';
import { useToast } from '../../context/ToastContext.js';
import { LoadingSpinner } from '../common/LoadingSpinner.js';
import { EpisodeFilters } from './EpisodeFilters.js';
import { EpisodeTable } from './EpisodeTable.js';
import { EditEpisodeModal } from './EditEpisodeModal.js';
import { ReplaceVideoModal } from './ReplaceVideoModal.js';
import { DeleteConfirmModal } from './DeleteConfirmModal.js';
import { Layers, Plus, Film, Video, RefreshCw } from 'lucide-react';

interface EpisodeManagementProps {
  onOpenAddEpisode?: () => void;
}

export const EpisodeManagement: React.FC<EpisodeManagementProps> = ({ onOpenAddEpisode }) => {
  const { showToast } = useToast();

  const [dramas, setDramas] = useState<Drama[]>([]);
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters State
  const [selectedDramaId, setSelectedDramaId] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modals State
  const [editingEpisode, setEditingEpisode] = useState<Episode | null>(null);
  const [replacingVideoEp, setReplacingVideoEp] = useState<Episode | null>(null);
  const [deletingEpisode, setDeletingEpisode] = useState<Episode | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [dRes, epList] = await Promise.all([
        dramaService.getAllDramas(),
        dramaService.getAllEpisodes()
      ]);
      setDramas(dRes.dramas);
      setEpisodes(epList);
    } catch (err: any) {
      showToast(err.message || 'Failed to load episodes', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Map of Drama ID to Drama Object for fast lookup
  const dramasMap = useMemo(() => {
    const map: Record<string, Drama> = {};
    dramas.forEach((d) => {
      map[d.id] = d;
    });
    return map;
  }, [dramas]);

  // Filtered Episodes
  const filteredEpisodes = useMemo(() => {
    return episodes.filter((ep) => {
      if (selectedDramaId !== 'all' && ep.dramaId !== selectedDramaId) {
        return false;
      }
      if (searchQuery.trim() !== '') {
        const q = searchQuery.toLowerCase().trim();
        const epNumStr = ep.episodeNumber.toString();
        const epTitleStr = ep.title.toLowerCase();
        const dramaTitleStr = (dramasMap[ep.dramaId]?.title || '').toLowerCase();
        return epTitleStr.includes(q) || epNumStr === q || dramaTitleStr.includes(q);
      }
      return true;
    });
  }, [episodes, selectedDramaId, searchQuery, dramasMap]);

  // Handle Episode Deletion
  const handleConfirmDelete = async () => {
    if (!deletingEpisode) return;
    setDeleteLoading(true);
    try {
      await dramaService.deleteEpisode(deletingEpisode.id);
      showToast(`Episode "${deletingEpisode.title}" deleted successfully`, 'info');
      setDeletingEpisode(null);
      loadData();
    } catch (err: any) {
      showToast(err.message || 'Error deleting episode', 'error');
    } finally {
      setDeleteLoading(false);
    }
  };

  if (loading) return <LoadingSpinner label="Loading Episode Management System..." />;

  return (
    <div className="space-y-6">
      {/* Top Banner / Stats & Control Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-[#00C2FF]/10 border border-[#00C2FF]/30 flex items-center justify-center text-[#00C2FF]">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight">Episode Management System</h2>
            <p className="text-xs text-slate-400">
              Edit episode metadata, replace stream video files, update subtitles and manage series tracks.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <button
            onClick={loadData}
            className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
            title="Refresh Episode List"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          {onOpenAddEpisode && (
            <button
              onClick={onOpenAddEpisode}
              className="flex-1 md:flex-initial px-4 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-rose-600/30 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Add New Episode
            </button>
          )}
        </div>
      </div>

      {/* Quick Stats Badges */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-[11px] font-semibold text-slate-400 block">Total Episodes</span>
            <span className="text-xl font-extrabold text-white">{episodes.length}</span>
          </div>
          <Video className="w-5 h-5 text-[#00C2FF]" />
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-[11px] font-semibold text-slate-400 block">Active Filter Count</span>
            <span className="text-xl font-extrabold text-white">{filteredEpisodes.length}</span>
          </div>
          <Layers className="w-5 h-5 text-pink-400" />
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between col-span-2 sm:col-span-1">
          <div className="space-y-0.5">
            <span className="text-[11px] font-semibold text-slate-400 block">Available Dramas</span>
            <span className="text-xl font-extrabold text-white">{dramas.length}</span>
          </div>
          <Film className="w-5 h-5 text-purple-400" />
        </div>
      </div>

      {/* Filters */}
      <EpisodeFilters
        dramas={dramas}
        selectedDramaId={selectedDramaId}
        onSelectDramaId={setSelectedDramaId}
        searchQuery={searchQuery}
        onSearchQueryChange={setSearchQuery}
        onReset={() => {
          setSelectedDramaId('all');
          setSearchQuery('');
        }}
      />

      {/* Episode Table */}
      <EpisodeTable
        episodes={filteredEpisodes}
        dramasMap={dramasMap}
        onEdit={(ep) => setEditingEpisode(ep)}
        onReplaceVideo={(ep) => setReplacingVideoEp(ep)}
        onDelete={(ep) => setDeletingEpisode(ep)}
      />

      {/* Modals */}
      <EditEpisodeModal
        isOpen={!!editingEpisode}
        episode={editingEpisode}
        dramas={dramas}
        onSuccess={() => {
          setEditingEpisode(null);
          loadData();
        }}
        onCancel={() => setEditingEpisode(null)}
      />

      <ReplaceVideoModal
        isOpen={!!replacingVideoEp}
        episode={replacingVideoEp}
        onSuccess={() => {
          setReplacingVideoEp(null);
          loadData();
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
    </div>
  );
};
