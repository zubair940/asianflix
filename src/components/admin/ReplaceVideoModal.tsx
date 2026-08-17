import React, { useState } from 'react';
import { Episode } from '../../types.js';
import { dramaService } from '../../services/dramaService.js';
import { adminService } from '../../services/adminService.js';
import { useToast } from '../../context/ToastContext.js';
import { Video, Upload, Link as LinkIcon, Loader2, X, CheckCircle2 } from 'lucide-react';

interface ReplaceVideoModalProps {
  isOpen: boolean;
  episode: Episode | null;
  onSuccess: () => void;
  onCancel: () => void;
}

export const ReplaceVideoModal: React.FC<ReplaceVideoModalProps> = ({
  isOpen,
  episode,
  onSuccess,
  onCancel
}) => {
  const { showToast } = useToast();

  const [inputMode, setInputMode] = useState<'file' | 'url'>('file');
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen || !episode) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    let finalVideoUrl = videoUrl.trim();

    if (inputMode === 'file') {
      if (!videoFile) {
        showToast('Please select a video file to replace', 'error');
        return;
      }
      setLoading(true);
      try {
        const uploadRes = await adminService.uploadFile(videoFile, undefined, `dramas/${episode.dramaId}/episodes`);
        finalVideoUrl = uploadRes.url;
      } catch (err: any) {
        setLoading(false);
        showToast(err.message || 'Failed to upload video file', 'error');
        return;
      }
    } else {
      if (!finalVideoUrl) {
        showToast('Please enter a valid video stream URL', 'error');
        return;
      }
    }

    setLoading(true);
    try {
      await dramaService.replaceEpisodeVideo(episode.id, finalVideoUrl);
      showToast(`Video replaced for Episode ${episode.episodeNumber}`, 'success');
      onSuccess();
    } catch (err: any) {
      showToast(err.message || 'Error replacing video', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#00C2FF]/10 border border-[#00C2FF]/30 flex items-center justify-center text-[#00C2FF]">
              <Video className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-white">Replace Episode Video</h3>
              <p className="text-xs text-slate-400">
                Ep {episode.episodeNumber}: {episode.title}
              </p>
            </div>
          </div>
          <button
            onClick={onCancel}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current Video Info */}
        <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 text-xs space-y-1">
          <span className="text-slate-500 font-semibold block uppercase text-[10px]">Current Stream Source:</span>
          <p className="text-slate-300 font-mono truncate">{episode.videoUrl}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Input Mode Selector */}
          <div className="flex rounded-xl bg-slate-950 p-1 border border-slate-800">
            <button
              type="button"
              onClick={() => setInputMode('file')}
              className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                inputMode === 'file' ? 'bg-[#00C2FF] text-black shadow-md' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Upload className="w-3.5 h-3.5" /> Upload File (.mp4, .webm)
            </button>
            <button
              type="button"
              onClick={() => setInputMode('url')}
              className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                inputMode === 'url' ? 'bg-[#00C2FF] text-black shadow-md' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <LinkIcon className="w-3.5 h-3.5" /> Direct Video URL
            </button>
          </div>

          {/* Mode 1: Local File Picker */}
          {inputMode === 'file' ? (
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-300 block">Select New Video File</label>
              <div className="relative border-2 border-dashed border-slate-800 hover:border-[#00C2FF]/60 rounded-2xl p-6 text-center bg-slate-950 transition-colors group cursor-pointer">
                <input
                  type="file"
                  accept="video/mp4,video/webm,video/mkv,video/*"
                  onChange={(e) => setVideoFile(e.target.files?.[0] || null)}
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                />
                <div className="space-y-2 pointer-events-none">
                  <Upload className="w-8 h-8 text-[#00C2FF] mx-auto group-hover:scale-110 transition-transform" />
                  {videoFile ? (
                    <div className="flex items-center justify-center gap-1.5 text-xs text-emerald-400 font-bold">
                      <CheckCircle2 className="w-4 h-4" /> {videoFile.name} ({(videoFile.size / (1024 * 1024)).toFixed(1)} MB)
                    </div>
                  ) : (
                    <div>
                      <p className="text-xs font-semibold text-slate-300">Click or drag MP4 video here</p>
                      <p className="text-[11px] text-slate-500">Supports H.264/MP4, WebM (Up to 2GB)</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            /* Mode 2: Direct URL */
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-300 block">Video Stream URL</label>
              <input
                type="url"
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
                placeholder="https://example.com/stream/episode.mp4"
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#00C2FF]"
              />
            </div>
          )}

          {/* Buttons */}
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
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#00C2FF] to-[#0047FF] hover:brightness-110 text-black text-xs font-extrabold flex items-center gap-2 shadow-lg shadow-cyan-500/20 transition-all cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Replacing Video...
                </>
              ) : (
                'Replace Video'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
