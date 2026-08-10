import React, { useState } from 'react';
import { Drama } from '../../types.js';
import { dramaService } from '../../services/dramaService.js';
import { adminService } from '../../services/adminService.js';
import { useToast } from '../../context/ToastContext.js';
import { Plus, Upload, X, Film, FileText } from 'lucide-react';

interface AddEpisodeProps {
  dramas: Drama[];
  preselectedDramaId?: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export const AddEpisode: React.FC<AddEpisodeProps> = ({
  dramas,
  preselectedDramaId,
  onSuccess,
  onCancel
}) => {
  const { showToast } = useToast();

  const [dramaId, setDramaId] = useState(preselectedDramaId || (dramas[0]?.id || ''));
  const [episodeNumber, setEpisodeNumber] = useState(1);
  const [title, setTitle] = useState('');
  const [duration, setDuration] = useState('65 mins');
  const [videoUrl, setVideoUrl] = useState('https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4');
  const [thumbnail, setThumbnail] = useState('');
  const [subtitleUrl, setSubtitleUrl] = useState('/sample-sub-en.vtt');
  const [subLang, setSubLang] = useState('en');
  const [subLabel, setSubLabel] = useState('English');

  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, field: 'video' | 'sub' | 'thumb') => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const res = await adminService.uploadFile(file);
      if (field === 'video') setVideoUrl(res.url);
      else if (field === 'sub') setSubtitleUrl(res.url);
      else if (field === 'thumb') setThumbnail(res.url);
      showToast(`File "${file.name}" uploaded successfully`, 'success');
    } catch (err: any) {
      showToast(err.message || 'File upload error', 'error');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dramaId || !title || !videoUrl) {
      showToast('Drama, Episode Title, and Video URL are required', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const subs = subtitleUrl ? [{ language: subLang, label: subLabel, url: subtitleUrl }] : [];

      await dramaService.createEpisode({
        dramaId,
        episodeNumber: Number(episodeNumber),
        title,
        duration,
        videoUrl,
        thumbnail,
        subtitles: subs
      });

      showToast(`Episode ${episodeNumber} added successfully!`, 'success');
      onSuccess();
    } catch (err: any) {
      showToast(err.message || 'Error adding episode', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-6 bg-slate-900 rounded-3xl border border-slate-800 space-y-6">
      <div className="flex items-center justify-between pb-4 border-b border-slate-800">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <Film className="w-5 h-5 text-rose-500" /> Add New Episode
        </h2>
        <button onClick={onCancel} className="p-1 rounded-lg text-slate-400 hover:text-white">
          <X className="w-5 h-5" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="font-semibold text-slate-300">Select Drama</label>
            <select
              value={dramaId}
              onChange={(e) => setDramaId(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-100 outline-none focus:border-rose-500"
            >
              {dramas.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.title} ({d.releaseYear})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <label className="font-semibold text-slate-300">Episode #</label>
              <input
                type="number"
                min={1}
                required
                value={episodeNumber}
                onChange={(e) => setEpisodeNumber(parseInt(e.target.value) || 1)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-100 outline-none focus:border-rose-500"
              />
            </div>
            <div className="space-y-1">
              <label className="font-semibold text-slate-300">Duration</label>
              <input
                type="text"
                placeholder="e.g. 65 mins"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-100 outline-none focus:border-rose-500"
              />
            </div>
          </div>
        </div>

        <div className="space-y-1">
          <label className="font-semibold text-slate-300">Episode Title</label>
          <input
            type="text"
            required
            placeholder="e.g. The Fateful Encounter"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-100 outline-none focus:border-rose-500"
          />
        </div>

        {/* Video File / URL Upload */}
        <div className="space-y-1">
          <label className="font-semibold text-slate-300">Video Stream URL or Local MP4/MKV Upload</label>
          <div className="flex gap-2">
            <input
              type="text"
              required
              placeholder="https://...mp4 or /uploads/..."
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-100 outline-none focus:border-rose-500"
            />
            <label className="px-3 py-2 bg-slate-800 border border-slate-700 hover:bg-slate-700 rounded-xl text-slate-200 cursor-pointer flex items-center gap-1 shrink-0 font-semibold">
              <Upload className="w-3.5 h-3.5" /> Upload MP4
              <input type="file" accept="video/mp4,video/mkv,video/webm" onChange={(e) => handleFileUpload(e, 'video')} className="hidden" />
            </label>
          </div>
        </div>

        {/* Subtitles Upload (.srt / .vtt) */}
        <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-3">
          <div className="flex items-center gap-2 font-semibold text-slate-300">
            <FileText className="w-4 h-4 text-rose-400" /> Subtitle File (.srt / .vtt)
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <input
              type="text"
              placeholder="Language Code (en, kr, es)"
              value={subLang}
              onChange={(e) => setSubLang(e.target.value)}
              className="bg-slate-900 border border-slate-800 rounded-xl p-2 text-slate-100 outline-none"
            />
            <input
              type="text"
              placeholder="Label (English, Korean)"
              value={subLabel}
              onChange={(e) => setSubLabel(e.target.value)}
              className="bg-slate-900 border border-slate-800 rounded-xl p-2 text-slate-100 outline-none"
            />
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Subtitle file URL"
                value={subtitleUrl}
                onChange={(e) => setSubtitleUrl(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2 text-slate-100 outline-none"
              />
              <label className="px-2.5 py-1.5 bg-slate-800 border border-slate-700 hover:bg-slate-700 rounded-xl text-slate-200 cursor-pointer flex items-center gap-1 shrink-0 font-medium">
                <Upload className="w-3 h-3" /> SRT
                <input type="file" accept=".srt,.vtt" onChange={(e) => handleFileUpload(e, 'sub')} className="hidden" />
              </label>
            </div>
          </div>
        </div>

        {/* Thumbnail Image */}
        <div className="space-y-1">
          <label className="font-semibold text-slate-300">Episode Thumbnail (Optional)</label>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Thumbnail image URL"
              value={thumbnail}
              onChange={(e) => setThumbnail(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-100 outline-none focus:border-rose-500"
            />
            <label className="px-3 py-2 bg-slate-800 border border-slate-700 hover:bg-slate-700 rounded-xl text-slate-200 cursor-pointer flex items-center gap-1 shrink-0 font-semibold">
              <Upload className="w-3.5 h-3.5" /> File
              <input type="file" accept="image/*" onChange={(e) => handleFileUpload(e, 'thumb')} className="hidden" />
            </label>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting || uploading}
            className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold shadow-lg shadow-rose-600/30 disabled:opacity-50"
          >
            {submitting ? 'Adding...' : 'Save Episode'}
          </button>
        </div>
      </form>
    </div>
  );
};
