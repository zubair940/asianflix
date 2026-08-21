import React, { useState, useEffect, useMemo } from 'react';
import { Drama } from '../../types.js';
import { dramaService } from '../../services/dramaService.js';
import { adminService } from '../../services/adminService.js';
import { useToast } from '../../context/ToastContext.js';
import { Plus, Upload, X, Film, FileText, Sparkles, Loader2, ChevronDown, ChevronUp, Search } from 'lucide-react';
import { SearchableDramaSelect } from './SearchableDramaSelect.js';
import { BulkEpisodeGenerator } from './BulkEpisodeGenerator.js';

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
  onCancel,
}) => {
  const { showToast } = useToast();

  const [dramaId, setDramaId] = useState(preselectedDramaId || '');
  const [episodeNumber, setEpisodeNumber] = useState(1);
  const [title, setTitle] = useState('');
  const [duration, setDuration] = useState('65 mins');
  const [videoUrl, setVideoUrl] = useState('');
  const [thumbnail, setThumbnail] = useState('');
  const [subtitleUrl, setSubtitleUrl] = useState('/sample-sub-en.vtt');
  const [subLang, setSubLang] = useState('en');
  const [subLabel, setSubLabel] = useState('English');
  const [showBulkGenerator, setShowBulkGenerator] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [uploadField, setUploadField] = useState<'video' | 'sub' | 'thumb' | null>(null);

  // Auto-set episode number when drama changes
  const selectedDrama = useMemo(() => dramas.find((d) => d.id === dramaId), [dramas, dramaId]);
  
  useEffect(() => {
    if (selectedDrama) {
      setEpisodeNumber((selectedDrama.episodeCount || 0) + 1);
    }
  }, [selectedDrama]);

  useEffect(() => {
    if (preselectedDramaId && !dramaId) {
      setDramaId(preselectedDramaId);
    }
  }, [preselectedDramaId, dramaId]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, field: 'video' | 'sub' | 'thumb') => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    if (!dramaId) {
      showToast('Select a drama first, then choose the file', 'error');
      return;
    }

    setUploading(true);
    setUploadField(field);
    setUploadProgress(0);
    try {
      const ext = file.name.match(/\.[a-z0-9]+$/i)?.[0] || '.mp4';
      const mediaPath =
        field === 'video'
          ? `dramas/${dramaId}/episodes/episode-${episodeNumber}${ext}`
          : field === 'thumb'
            ? `dramas/${dramaId}/episodes/thumb-${episodeNumber}${ext}`
            : `dramas/${dramaId}/subtitles/episode-${episodeNumber}${ext}`;
      const res = await adminService.uploadFile(file, (p) => setUploadProgress(p), mediaPath);
      if (field === 'video') setVideoUrl(res.url);
      else if (field === 'sub') setSubtitleUrl(res.url);
      else if (field === 'thumb') setThumbnail(res.url);
      showToast(`File "${file.name}" uploaded successfully`, 'success');
    } catch (err: any) {
      showToast((err && err.message) || 'File upload error', 'error');
    } finally {
      setUploading(false);
      setUploadField(null);
      setUploadProgress(null);
    }
  };

  const handleSubmit = async () => {
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
        subtitles: subs,
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
    <div className="p-6 bg-slate-900 rounded-3xl border border-slate-800 space-y-6 max-h-[90vh] overflow-y-auto">
      {/* Header with Bulk Generator Toggle */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-800">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <Film className="w-5 h-5 text-rose-500" /> Add New Episode
        </h2>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowBulkGenerator(true)}
            className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-amber-500/30 transition-all cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" /> Bulk Create
          </button>
          <button onClick={onCancel} className="p-1 rounded-lg text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Bulk Episode Generator Modal */}
      {showBulkGenerator && (
        <BulkEpisodeGenerator
          dramas={dramas}
          onSuccess={() => {
            setShowBulkGenerator(false);
            onSuccess();
          }}
          onCancel={() => setShowBulkGenerator(false)}
        />
      )}

      {/* Single Episode Form */}
      {!showBulkGenerator && (
        <div className="space-y-5 text-xs">
          {/* Drama Selection with Search */}
          <div className="space-y-1">
            <label className="font-semibold text-slate-300 flex items-center gap-2">
              <Film className="w-4 h-4 text-cyan-400" />
              Select Drama <span className="text-rose-400">*</span>
            </label>
            <SearchableDramaSelect
              dramas={dramas}
              value={dramaId}
              onChange={setDramaId}
              placeholder="Type to search dramas by title, genre, year..."
              label=""
              showEpisodeCount={true}
            />
            {selectedDrama && (
              <p className="text-[11px] text-slate-500">
                Current episodes: <span className="text-amber-400 font-bold">{selectedDrama.episodeCount || 0}</span> —
                Next episode will be: <span className="text-green-400 font-bold">#{episodeNumber}</span>
              </p>
            )}
          </div>

          {/* Episode Number & Duration */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1">
              <label className="font-semibold text-slate-300">Episode #</label>
              <input
                type="number"
                min={1}
                required
                value={episodeNumber}
                onChange={(e) => setEpisodeNumber(Math.max(1, parseInt(e.target.value) || 1))}
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
            <div className="space-y-1">
              <label className="font-semibold text-slate-300">Season (Optional)</label>
              <input
                type="number"
                min={1}
                placeholder="1"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-100 outline-none focus:border-rose-500"
              />
            </div>
          </div>

          {/* Episode Title */}
          <div className="space-y-1">
            <label className="font-semibold text-slate-300">Episode Title <span className="text-rose-400">*</span></label>
            <input
              type="text"
              required
              placeholder="e.g. The Fateful Encounter"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-100 outline-none focus:border-rose-500"
            />
          </div>

          {/* Video URL / Upload */}
          <div className="space-y-1">
            <label className="font-semibold text-slate-300">Video Stream URL <span className="text-rose-400">*</span></label>
            <div className="flex gap-2">
              <input
                type="text"
                required
                placeholder="https://...mp4 or /uploads/..."
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-100 outline-none focus:border-rose-500"
              />
              <label className="px-3 py-2 bg-slate-800 border border-slate-700 hover:bg-slate-700 rounded-xl text-slate-200 cursor-pointer flex items-center gap-1 shrink-0 font-semibold disabled:opacity-50 disabled:cursor-not-allowed">
                {uploading && uploadField === 'video' ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" /> {uploadProgress ?? 0}%
                  </>
                ) : (
                  <>
                    <Upload className="w-3.5 h-3.5" /> Upload MP4
                  </>
                )}
                <input
                  type="file"
                  accept="video/*"
                  onChange={(e) => handleFileUpload(e, 'video')}
                  className="hidden"
                  disabled={uploading}
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
                />
              </label>
            </div>
            {uploading && uploadField === 'video' && (
              <div className="space-y-1 mt-1">
                <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-rose-500 to-pink-500 transition-all duration-200" style={{ width: `${uploadProgress ?? 0}%` }} />
                </div>
                <span className="text-[10px] text-rose-300">{uploadProgress ?? 0}% uploaded to media server</span>
              </div>
            )}
            <p className="text-[10px] text-slate-500">Supports MP4, MKV, WebM, HLS (.m3u8), DASH (.mpd)</p>
          </div>

          {/* Subtitles */}
          <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-3">
            <div className="flex items-center gap-2 font-semibold text-slate-300">
              <FileText className="w-4 h-4 text-rose-400" /> Subtitle File (.srt / .vtt)
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
                <label className="px-2.5 py-1.5 bg-slate-800 border border-slate-700 hover:bg-slate-700 rounded-xl text-slate-200 cursor-pointer flex items-center gap-1 shrink-0 font-medium disabled:opacity-50 disabled:cursor-not-allowed">
                  {uploading && uploadField === 'sub' ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <Upload className="w-3 h-3" />
                  )}
                  {uploading && uploadField === 'sub' ? `${uploadProgress ?? 0}%` : 'SRT'}
                  <input type="file" accept=".srt,.vtt" onChange={(e) => handleFileUpload(e, 'sub')} className="hidden" disabled={uploading} onClick={(e) => { e.preventDefault(); e.stopPropagation(); }} />
                </label>
              </div>
            </div>
            <p className="text-[10px] text-slate-500">Add multiple subtitle tracks in Edit Episode after creation</p>
          </div>

          {/* Thumbnail */}
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
              <label className="px-3 py-2 bg-slate-800 border border-slate-700 hover:bg-slate-700 rounded-xl text-slate-200 cursor-pointer flex items-center gap-1 shrink-0 font-semibold disabled:opacity-50 disabled:cursor-not-allowed">
                {uploading && uploadField === 'thumb' ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" /> {uploadProgress ?? 0}%
                  </>
                ) : (
                  <>
                    <Upload className="w-3.5 h-3.5" /> File
                  </>
                )}
                <input type="file" accept="image/*" onChange={(e) => handleFileUpload(e, 'thumb')} className="hidden" disabled={uploading} onClick={(e) => { e.preventDefault(); e.stopPropagation(); }} />
              </label>
            </div>
            <p className="text-[10px] text-slate-500">Recommended 16:9 aspect ratio, min 1280x720</p>
          </div>

          {/* Advanced Options */}
          <details className="p-3.5 rounded-xl bg-slate-950/50 border border-slate-800">
            <summary className="font-semibold text-slate-300 flex items-center gap-2 cursor-pointer">
              <ChevronDown className="w-4 h-4 text-slate-400" />
              Advanced Options
            </summary>
            <div className="mt-3 space-y-3 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-300">Skip Intro (seconds)</label>
                  <input
                    type="number"
                    min={0}
                    placeholder="0"
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2 text-slate-100 outline-none focus:border-rose-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-slate-300">Skip Outro (seconds)</label>
                  <input
                    type="number"
                    min={0}
                    placeholder="0"
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2 text-slate-100 outline-none focus:border-rose-500"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="font-semibold text-slate-300">Episode Description / Synopsis</label>
                <textarea
                  rows={3}
                  placeholder="Brief description of this episode..."
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-slate-100 outline-none focus:border-rose-500"
                />
              </div>
              <div className="space-y-1">
                <label className="font-semibold text-slate-300">Guest Stars / Cameos (comma separated)</label>
                <input
                  type="text"
                  placeholder="Actor Name, Actor Name"
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-slate-100 outline-none focus:border-rose-500"
                />
              </div>
            </div>
          </details>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onCancel}
              disabled={submitting || uploading}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting || uploading || !dramaId || !title || !videoUrl}
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 text-white font-bold shadow-lg shadow-rose-600/30 disabled:opacity-50 flex items-center gap-2"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Adding...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  Save Episode
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};