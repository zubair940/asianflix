import React, { useState, useEffect } from 'react';
import { Drama, Episode } from '../../types.js';
import { dramaService } from '../../services/dramaService.js';
import { useToast } from '../../context/ToastContext.js';
import { ArrowUp, ArrowDown, GripVertical, Save, X, Loader2, ListOrdered, CheckCircle2 } from 'lucide-react';

interface ReorderEpisodesModalProps {
  isOpen: boolean;
  dramaId?: string;
  dramas: Drama[];
  onSuccess: () => void;
  onCancel: () => void;
}

export const ReorderEpisodesModal: React.FC<ReorderEpisodesModalProps> = ({
  isOpen,
  dramaId: initialDramaId,
  dramas,
  onSuccess,
  onCancel
}) => {
  const { showToast } = useToast();

  const [selectedDramaId, setSelectedDramaId] = useState<string>(initialDramaId || dramas[0]?.id || '');
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [draggedIdx, setDraggedIdx] = useState<number | null>(null);

  useEffect(() => {
    if (initialDramaId) {
      setSelectedDramaId(initialDramaId);
    } else if (dramas.length > 0 && !selectedDramaId) {
      setSelectedDramaId(dramas[0].id);
    }
  }, [initialDramaId, dramas]);

  useEffect(() => {
    if (selectedDramaId && isOpen) {
      loadEpisodes(selectedDramaId);
    }
  }, [selectedDramaId, isOpen]);

  const loadEpisodes = async (dId: string) => {
    setLoading(true);
    try {
      const epList = await dramaService.getAllEpisodes({ dramaId: dId });
      // ensure ordered by current episodeNumber
      epList.sort((a, b) => a.episodeNumber - b.episodeNumber);
      setEpisodes(epList);
    } catch (err: any) {
      showToast(err.message || 'Failed to load drama episodes', 'error');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  // Move Up
  const moveUp = (index: number) => {
    if (index === 0) return;
    const newArr = [...episodes];
    const temp = newArr[index - 1];
    newArr[index - 1] = newArr[index];
    newArr[index] = temp;
    setEpisodes(newArr);
  };

  // Move Down
  const moveDown = (index: number) => {
    if (index === episodes.length - 1) return;
    const newArr = [...episodes];
    const temp = newArr[index + 1];
    newArr[index + 1] = newArr[index];
    newArr[index] = temp;
    setEpisodes(newArr);
  };

  // Drag and Drop handlers
  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIdx(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIdx === null || draggedIdx === index) return;

    const updated = [...episodes];
    const draggedItem = updated[draggedIdx];
    updated.splice(draggedIdx, 1);
    updated.splice(index, 0, draggedItem);

    setDraggedIdx(index);
    setEpisodes(updated);
  };

  const handleDragEnd = () => {
    setDraggedIdx(null);
  };

  // Save new reordered sequence to server
  const handleSaveOrder = async () => {
    if (episodes.length === 0) return;
    setSaving(true);
    try {
      const episodeIds = episodes.map((ep) => ep.id);
      await dramaService.reorderEpisodes(selectedDramaId, episodeIds);
      showToast('Episodes reordered and numbers updated successfully!', 'success');
      onSuccess();
    } catch (err: any) {
      showToast(err.message || 'Error saving new episode order', 'error');
    } finally {
      setSaving(false);
    }
  };

  const currentDrama = dramas.find((d) => d.id === selectedDramaId);

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-5 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-500">
              <ListOrdered className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-white">Reorder Episodes (Drag & Drop)</h3>
              <p className="text-xs text-slate-400">
                Drag cards or use up/down arrows to change playback order. Numbers auto-update.
              </p>
            </div>
          </div>
          <button
            onClick={onCancel}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Drama Selector if not fixed */}
        {!initialDramaId && dramas.length > 0 && (
          <div className="space-y-1 shrink-0">
            <label className="text-xs font-bold text-slate-300">Select K-Drama to Reorder</label>
            <select
              value={selectedDramaId}
              onChange={(e) => setSelectedDramaId(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs font-semibold text-white focus:outline-none focus:border-[#00C2FF]"
            >
              {dramas.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.title} ({d.releaseYear})
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Drama Title Banner */}
        {currentDrama && (
          <div className="px-4 py-2.5 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between shrink-0 text-xs">
            <div className="flex items-center gap-2">
              <img
                src={currentDrama.poster}
                alt={currentDrama.title}
                className="w-7 h-10 rounded object-cover border border-slate-800"
              />
              <div>
                <span className="font-bold text-white block">{currentDrama.title}</span>
                <span className="text-[10px] text-slate-400 font-mono">{episodes.length} Total Episodes</span>
              </div>
            </div>
            <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-lg border border-emerald-500/20">
              Drag-and-Drop Active
            </span>
          </div>
        )}

        {/* Episodes Reorderable List */}
        <div className="flex-1 overflow-y-auto pr-1 space-y-2 min-h-[220px]">
          {loading ? (
            <div className="py-12 flex justify-center">
              <Loader2 className="w-6 h-6 text-rose-500 animate-spin" />
            </div>
          ) : episodes.length === 0 ? (
            <div className="text-center py-12 text-slate-500 text-xs">
              No episodes uploaded for this drama yet.
            </div>
          ) : (
            episodes.map((ep, idx) => (
              <div
                key={ep.id}
                draggable
                onDragStart={(e) => handleDragStart(e, idx)}
                onDragOver={(e) => handleDragOver(e, idx)}
                onDragEnd={handleDragEnd}
                className={`p-3 rounded-2xl border transition-all flex items-center gap-3 cursor-grab active:cursor-grabbing ${
                  draggedIdx === idx
                    ? 'bg-rose-950/60 border-rose-500 shadow-xl scale-[1.01]'
                    : 'bg-slate-950/80 border-slate-800 hover:border-slate-700 hover:bg-slate-950'
                }`}
              >
                {/* Drag Handle */}
                <GripVertical className="w-4 h-4 text-slate-600 shrink-0" />

                {/* Auto Index Badge */}
                <span className="w-7 h-7 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center font-mono font-black text-xs text-[#00C2FF] shrink-0">
                  {idx + 1}
                </span>

                {/* Thumbnail */}
                <img
                  src={ep.thumbnail}
                  alt={ep.title}
                  className="w-12 h-8 rounded-lg object-cover border border-slate-800 shrink-0"
                />

                {/* Title & Metadata */}
                <div className="flex-1 min-w-0 text-xs">
                  <h4 className="font-bold text-white truncate">{ep.title}</h4>
                  <p className="text-[10px] text-slate-400 font-mono">Original Ep #{ep.episodeNumber} • {ep.duration}</p>
                </div>

                {/* Arrow Controls */}
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => moveUp(idx)}
                    disabled={idx === 0}
                    className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors"
                    title="Move Up"
                  >
                    <ArrowUp className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => moveDown(idx)}
                    disabled={idx === episodes.length - 1}
                    className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors"
                    title="Move Down"
                  >
                    <ArrowDown className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-800 shrink-0">
          <p className="text-[11px] text-slate-500 italic">
            * Changes take effect after clicking Save New Sequence.
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onCancel}
              disabled={saving}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-all cursor-pointer disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSaveOrder}
              disabled={saving || episodes.length === 0}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-pink-600 hover:brightness-110 text-white text-xs font-extrabold flex items-center gap-2 shadow-lg shadow-rose-600/30 transition-all cursor-pointer disabled:opacity-50"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Saving Sequence...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" /> Save New Sequence
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
