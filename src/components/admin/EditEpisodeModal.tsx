import React, { useState, useEffect } from 'react';
import { Episode, Drama, Subtitle } from '../../types.js';
import { dramaService } from '../../services/dramaService.js';
import { adminService } from '../../services/adminService.js';
import { useToast } from '../../context/ToastContext.js';
import { Edit3, Upload, Loader2, X, Plus, Trash2, FileText } from 'lucide-react';

interface EditEpisodeModalProps {
  isOpen: boolean;
  episode: Episode | null;
  dramas: Drama[];
  onSuccess: () => void;
  onCancel: () => void;
}

export const EditEpisodeModal: React.FC<EditEpisodeModalProps> = ({
  isOpen,
  episode,
  dramas,
  onSuccess,
  onCancel
}) => {
  const { showToast } = useToast();

  const [dramaId, setDramaId] = useState('');
  const [episodeNumber, setEpisodeNumber] = useState(1);
  const [title, setTitle] = useState('');
  const [duration, setDuration] = useState('60 mins');
  const [thumbnail, setThumbnail] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [subtitles, setSubtitles] = useState<Subtitle[]>([]);

  const [newSubLang, setNewSubLang] = useState('en');
  const [newSubLabel, setNewSubLabel] = useState('English');
  const [newSubUrl, setNewSubUrl] = useState('');

  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (episode) {
      setDramaId(episode.dramaId || '');
      setEpisodeNumber(episode.episodeNumber || 1);
      setTitle(episode.title || '');
      setDuration(episode.duration || '60 mins');
      setThumbnail(episode.thumbnail || '');
      setVideoUrl(episode.videoUrl || '');
      setSubtitles(episode.subtitles || []);
    }
  }, [episode]);

  if (!isOpen || !episode) return null;

  const handleFileUpload = async (file: File) => {
    try {
      const res = await adminService.uploadFile(file);
      return res.url;
    } catch (err: any) {
      showToast(err.message || 'File upload failed', 'error');
      return null;
    }
  };

  const handleAddSubtitle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubUrl.trim()) return;

    const newSub: Subtitle = {
      language: newSubLang,
      label: newSubLabel,
      url: newSubUrl.trim()
    };

    setSubtitles([...subtitles, newSub]);
    setNewSubUrl('');
  };

  const handleRemoveSubtitle = (index: number) => {
    setSubtitles(subtitles.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      showToast('Episode title is required', 'error');
      return;
    }

    setLoading(true);
    try {
      let finalVideoUrl = videoUrl;

      if (videoFile) {
        const uploadedUrl = await handleFileUpload(videoFile);
        if (uploadedUrl) {
          finalVideoUrl = uploadedUrl;
        }
      }

      await dramaService.updateEpisode(episode.id, {
        dramaId,
        episodeNumber: Number(episodeNumber),
        title: title.trim(),
        duration: duration.trim(),
        thumbnail: thumbnail.trim(),
        videoUrl: finalVideoUrl,
        subtitles
      });

      showToast(`Episode ${episodeNumber} updated successfully`, 'success');
      onSuccess();
    } catch (err: any) {
      showToast(err.message || 'Failed to update episode', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-500">
              <Edit3 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-white">Edit Episode Details</h3>
              <p className="text-xs text-slate-400">Modify metadata, replace stream video or update subtitles</p>
            </div>
          </div>
          <button
            onClick={onCancel}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Drama Dropdown */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2 space-y-1.5">
              <label className="text-xs font-bold text-slate-300">Associated K-Drama</label>
              <select
                value={dramaId}
                onChange={(e) => setDramaId(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs font-semibold text-white focus:outline-none focus:border-[#00C2FF]"
              >
                {dramas.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.title} ({d.releaseYear})
                  </option>
                ))}
              </select>
            </div>

            {/* Episode Number */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300">Episode Number</label>
              <input
                type="number"
                min={1}
                value={episodeNumber}
                onChange={(e) => setEpisodeNumber(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs font-bold text-white focus:outline-none focus:border-[#00C2FF]"
              />
            </div>
          </div>

          {/* Title & Duration */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2 space-y-1.5">
              <label className="text-xs font-bold text-slate-300">Episode Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Episode 1: The Beginning"
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-[#00C2FF]"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300">Duration</label>
              <input
                type="text"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                placeholder="e.g. 65 mins"
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-[#00C2FF]"
              />
            </div>
          </div>

          {/* Thumbnail URL */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300">Thumbnail Image URL</label>
            <input
              type="text"
              value={thumbnail}
              onChange={(e) => setThumbnail(e.target.value)}
              placeholder="https://images.unsplash.com/..."
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-[#00C2FF]"
            />
          </div>

          {/* Video Stream URL / Replace File */}
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
            <label className="text-xs font-bold text-slate-300 flex items-center justify-between">
              <span>Video Stream Source</span>
              <span className="text-[11px] text-slate-500 font-normal">H.264 / MP4 / WebM</span>
            </label>
            <input
              type="text"
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
              placeholder="http://localhost:3000/uploads/episode.mp4"
              className="w-full px-3.5 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white font-mono focus:outline-none focus:border-[#00C2FF]"
            />

            <div className="flex items-center gap-3 pt-1">
              <label className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300 flex items-center gap-1.5 cursor-pointer transition-all">
                <Upload className="w-3.5 h-3.5 text-[#00C2FF]" />
                <span>Upload New MP4 File</span>
                <input
                  type="file"
                  accept="video/mp4,video/webm"
                  onChange={(e) => setVideoFile(e.target.files?.[0] || null)}
                  className="hidden"
                />
              </label>
              {videoFile && (
                <span className="text-xs text-emerald-400 font-bold truncate max-w-xs">
                  Ready to upload: {videoFile.name}
                </span>
              )}
            </div>
          </div>

          {/* Subtitles Section */}
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
            <label className="text-xs font-bold text-slate-300 flex items-center gap-2">
              <FileText className="w-4 h-4 text-pink-400" /> Manage Subtitles (.vtt / .srt)
            </label>

            {/* List existing subtitles */}
            <div className="space-y-1.5">
              {subtitles.length === 0 ? (
                <p className="text-[11px] text-slate-500 italic">No subtitles added yet.</p>
              ) : (
                subtitles.map((sub, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2 rounded-xl bg-slate-900 border border-slate-800 text-xs">
                    <span className="font-bold text-white">
                      [{sub.language.toUpperCase()}] {sub.label}
                    </span>
                    <span className="text-slate-400 font-mono text-[10px] truncate max-w-xs">{sub.url}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveSubtitle(idx)}
                      className="p-1 text-rose-400 hover:text-rose-300"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* Add new subtitle form */}
            <div className="flex flex-col sm:flex-row items-center gap-2 pt-2 border-t border-slate-800/80">
              <input
                type="text"
                placeholder="Lang (e.g. en)"
                value={newSubLang}
                onChange={(e) => setNewSubLang(e.target.value)}
                className="w-20 px-2.5 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white"
              />
              <input
                type="text"
                placeholder="Label (e.g. English)"
                value={newSubLabel}
                onChange={(e) => setNewSubLabel(e.target.value)}
                className="w-28 px-2.5 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white"
              />
              <input
                type="text"
                placeholder="Subtitle URL (.vtt or .srt)"
                value={newSubUrl}
                onChange={(e) => setNewSubUrl(e.target.value)}
                className="flex-1 w-full px-2.5 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white"
              />
              <button
                type="button"
                onClick={handleAddSubtitle}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-bold text-[#00C2FF] flex items-center gap-1 shrink-0"
              >
                <Plus className="w-3.5 h-3.5" /> Add
              </button>
            </div>
          </div>

          {/* Form Submit Footer */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onCancel}
              disabled={loading}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-all cursor-pointer disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-pink-600 hover:brightness-110 text-white text-xs font-extrabold flex items-center gap-2 shadow-lg shadow-rose-600/30 transition-all cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Saving Changes...
                </>
              ) : (
                'Update Episode'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
