import React, { useState, useMemo, memo } from 'react';
import { Drama } from '../../types.js';
import { dramaService } from '../../services/dramaService.js';
import { adminService } from '../../services/adminService.js';
import { useToast } from '../../context/ToastContext.js';
import { Plus, Minus, Upload, FileText, Film, Loader2, Trash2, Sparkles, X } from 'lucide-react';

interface BulkEpisodeGeneratorProps {
  dramas: Drama[];
  onSuccess: () => void;
  onCancel: () => void;
}

interface EpisodeTemplate {
  title: string;
  duration: string;
  videoUrl: string;
  thumbnail: string;
  subtitles: { language: string; label: string; url: string }[];
}

const DEFAULT_TEMPLATE: EpisodeTemplate = {
  title: '',
  duration: '65 mins',
  videoUrl: '',
  thumbnail: '',
  subtitles: [{ language: 'en', label: 'English', url: '/sample-sub-en.vtt' }],
};

const BulkEpisodeGenerator = memo(function BulkEpisodeGenerator({
  dramas,
  onSuccess,
  onCancel,
}: BulkEpisodeGeneratorProps) {
  const { showToast } = useToast();

  const [dramaId, setDramaId] = useState('');
  const [startEpisode, setStartEpisode] = useState(1);
  const [count, setCount] = useState(10);
  const [titlePattern, setTitlePattern] = useState('Episode {n}');
  const [duration, setDuration] = useState('65 mins');
  const [videoUrl, setVideoUrl] = useState('');
  const [thumbnail, setThumbnail] = useState('');
  const [subtitleUrl, setSubtitleUrl] = useState('/sample-sub-en.vtt');
  const [subLang, setSubLang] = useState('en');
  const [subLabel, setSubLabel] = useState('English');
  const [customTitles, setCustomTitles] = useState<string[]>([]);
  const [useCustomTitles, setUseCustomTitles] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [uploading, setUploading] = useState(false);

  const selectedDrama = dramas.find((d) => d.id === dramaId);
  const existingEpisodes = selectedDrama ? selectedDrama.episodeCount || 0 : 0;

  const previewEpisodes = useMemo(() => {
    const eps = [];
    for (let i = 0; i < count; i++) {
      const epNum = startEpisode + i;
      eps.push({
        number: epNum,
        title: useCustomTitles ? customTitles[i] || titlePattern.replace('{n}', epNum.toString()) : titlePattern.replace('{n}', epNum.toString()),
      });
    }
    return eps;
  }, [count, startEpisode, titlePattern, useCustomTitles, customTitles]);

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
    if (!dramaId || !videoUrl) {
      showToast('Please select a drama and provide a video URL', 'error');
      return;
    }

    setSubmitting(true);
    setProgress(0);

    try {
      const subs = subtitleUrl ? [{ language: subLang, label: subLabel, url: subtitleUrl }] : [];

      for (let i = 0; i < count; i++) {
        const epNum = startEpisode + i;
        const epTitle = useCustomTitles ? customTitles[i] || `Episode ${epNum}` : `Episode ${epNum}`;

        await dramaService.createEpisode({
          dramaId,
          episodeNumber: epNum,
          title: epTitle,
          duration,
          videoUrl,
          thumbnail,
          subtitles: subs,
        });

        setProgress(Math.round(((i + 1) / count) * 100));
      }

      showToast(`${count} episodes created successfully!`, 'success');
      onSuccess();
    } catch (err: any) {
      showToast(err.message || 'Error creating episodes', 'error');
    } finally {
      setSubmitting(false);
      setProgress(0);
    }
  };

  const handleCustomTitleChange = (index: number, value: string) => {
    const newTitles = [...customTitles];
    newTitles[index] = value;
    setCustomTitles(newTitles);
  };

  const addCustomTitle = () => {
    setCustomTitles([...customTitles, `Episode ${startEpisode + customTitles.length}`]);
  };

  const removeCustomTitle = (index: number) => {
    setCustomTitles(customTitles.filter((_, i) => i !== index));
  };

  return (
    <div className="p-6 bg-slate-900 rounded-3xl border border-slate-800 space-y-6 max-h-[90vh] overflow-y-auto">
      <div className="flex items-center justify-between pb-4 border-b border-slate-800">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-amber-400" />
          Bulk Episode Generator
        </h2>
        <button onClick={onCancel} className="p-1 rounded-lg text-slate-400 hover:text-white">
          <X className="w-5 h-5" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5 text-xs">
        {/* Drama Selection */}
        <div className="space-y-1">
          <label className="font-semibold text-slate-300 flex items-center gap-2">
            <Film className="w-4 h-4 text-cyan-400" />
            Select Drama <span className="text-rose-400">*</span>
          </label>
          <select
            value={dramaId}
            onChange={(e) => setDramaId(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-100 outline-none focus:border-rose-500"
          >
            <option value="">-- Choose a Drama --</option>
            {dramas.map((d) => (
              <option key={d.id} value={d.id}>
                {d.title} ({d.releaseYear}) - {d.episodeCount || 0} episodes
              </option>
            ))}
          </select>
          {selectedDrama && (
            <p className="text-[11px] text-slate-500">
              Selected: <span className="text-white font-medium">{selectedDrama.title}</span> —
              Currently has <span className="text-amber-400 font-bold">{existingEpisodes}</span> episodes
            </p>
          )}
        </div>

        {/* Episode Range */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="space-y-1">
            <label className="font-semibold text-slate-300">Start Episode #</label>
            <input
              type="number"
              min={1}
              value={startEpisode}
              onChange={(e) => setStartEpisode(Math.max(1, parseInt(e.target.value) || 1))}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-100 outline-none focus:border-rose-500"
            />
          </div>
          <div className="space-y-1">
            <label className="font-semibold text-slate-300">Number of Episodes</label>
            <input
              type="number"
              min={1}
              max={100}
              value={count}
              onChange={(e) => setCount(Math.min(100, Math.max(1, parseInt(e.target.value) || 1)))}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-100 outline-none focus:border-rose-500"
            />
          </div>
          <div className="space-y-1">
            <label className="font-semibold text-slate-300">Duration (each)</label>
            <input
              type="text"
              placeholder="e.g. 65 mins"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-100 outline-none focus:border-rose-500"
            />
          </div>
        </div>

        {/* Title Pattern */}
        <div className="space-y-1">
          <label className="font-semibold text-slate-300">Title Pattern <span className="text-slate-500">(use {'{' }n{'}'} for episode number)</span></label>
          <div className="flex gap-2">
            <input
              type="text"
              value={titlePattern}
              onChange={(e) => setTitlePattern(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-100 outline-none focus:border-rose-500"
              placeholder="Episode {n}"
            />
            <label
              className="flex items-center gap-2 px-3 py-2 bg-slate-800 border border-slate-700 hover:bg-slate-700 rounded-xl text-slate-200 cursor-pointer text-sm font-medium"
            >
              <FileText className="w-4 h-4" />
              Custom Titles
              <input
                type="checkbox"
                checked={useCustomTitles}
                onChange={(e) => {
                  setUseCustomTitles(e.target.checked);
                  if (e.target.checked && customTitles.length === 0) {
                    setCustomTitles(previewEpisodes.map((ep) => ep.title));
                  }
                }}
                className="hidden"
              />
            </label>
          </div>
        </div>

        {/* Custom Titles Editor */}
        {useCustomTitles && (
          <div className="space-y-2 p-4 rounded-xl bg-slate-950/50 border border-slate-800">
            <div className="flex items-center justify-between mb-2">
              <span className="font-semibold text-slate-300">Custom Episode Titles</span>
              <button
                type="button"
                onClick={addCustomTitle}
                className="p-1.5 rounded bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30 text-xs font-medium flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> Add
              </button>
            </div>
            <div className="space-y-1 max-h-48 overflow-y-auto">
              {customTitles.map((title, index) => (
                <div key={index} className="flex gap-2">
                  <span className="w-8 flex-shrink-0 text-center text-slate-400 text-[11px] font-mono">
                    Ep {startEpisode + index}
                  </span>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => handleCustomTitleChange(index, e.target.value)}
                    className="flex-1 bg-slate-900 border border-slate-800 rounded-xl p-2 text-slate-100 outline-none focus:border-rose-500"
                  />
                  <button
                    type="button"
                    onClick={() => removeCustomTitle(index)}
                    className="p-1.5 rounded bg-rose-500/20 text-rose-400 hover:bg-rose-500/30"
                    aria-label="Remove title"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Preview */}
        <div className="p-4 rounded-xl bg-slate-950/50 border border-slate-800">
          <div className="flex items-center justify-between mb-2">
            <span className="font-semibold text-slate-300">Preview ({previewEpisodes.length} episodes)</span>
            <span className="text-[10px] text-slate-500">Will create episodes {startEpisode}–{startEpisode + count - 1}</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-1 max-h-40 overflow-y-auto">
            {previewEpisodes.map((ep) => (
              <div
                key={ep.number}
                className={`px-2 py-1.5 rounded text-[10px] font-medium truncate ${
                  ep.number <= existingEpisodes
                    ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                    : 'bg-green-500/20 text-green-400 border border-green-500/30'
                }`}
              >
                <span className="font-mono mr-1">Ep {ep.number}:</span>
                {ep.title}
                {ep.number <= existingEpisodes && ' ⚠️'}
              </div>
            ))}
          </div>
        </div>

        {/* Video URL */}
        <div className="space-y-1">
          <label className="font-semibold text-slate-300">Video Stream URL <span className="text-rose-400">*</span></label>
          <div className="flex gap-2">
            <input
              type="text"
              required
              placeholder="https://...mp4 or /uploads/... (same URL for all episodes)"
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

        {/* Subtitles */}
        <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-3">
          <div className="flex items-center gap-2 font-semibold text-slate-300">
            <FileText className="w-4 h-4 text-rose-400" /> Subtitles (applied to all episodes)
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <input
              type="text"
              placeholder="Lang Code (en, kr, es)"
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
                placeholder="Subtitle URL"
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

        {/* Thumbnail */}
        <div className="space-y-1">
          <label className="font-semibold text-slate-300">Thumbnail Image (Optional, same for all)</label>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Thumbnail URL"
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

        {/* Progress Bar */}
        {submitting && (
          <div className="space-y-2 pt-4 border-t border-slate-800">
            <div className="flex justify-between text-xs text-slate-400">
              <span>Creating episodes...</span>
              <span>{progress}%</span>
            </div>
            <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-rose-500 to-pink-500 transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="flex justify-center gap-2">
              <Loader2 className="w-4 h-4 text-rose-400 animate-spin" />
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
          <button
            type="button"
            onClick={onCancel}
            disabled={submitting}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting || uploading || !dramaId || !videoUrl}
            className="px-5 py-2 rounded-xl bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 text-white font-bold shadow-lg shadow-rose-600/30 disabled:opacity-50 flex items-center gap-2"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <Plus className="w-4 h-4" />
                Create {count} Episodes
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
});

BulkEpisodeGenerator.displayName = 'BulkEpisodeGenerator';

export { BulkEpisodeGenerator };