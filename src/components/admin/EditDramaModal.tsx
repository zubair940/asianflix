import React, { useState, useEffect } from 'react';
import { Drama } from '../../types.js';
import { dramaService } from '../../services/dramaService.js';
import { adminService } from '../../services/adminService.js';
import { useToast } from '../../context/ToastContext.js';
import { DRAMA_CATEGORIES } from '../../utils/constants.js';
import { Edit, X, Loader2, Film, Globe, Upload } from 'lucide-react';

interface EditDramaModalProps {
  isOpen: boolean;
  drama: Drama | null;
  onSuccess: () => void;
  onCancel: () => void;
}

export const EditDramaModal: React.FC<EditDramaModalProps> = ({
  isOpen,
  drama,
  onSuccess,
  onCancel
}) => {
  const { showToast } = useToast();

  const [title, setTitle] = useState('');
  const [titleKR, setTitleKR] = useState('');
  const [description, setDescription] = useState('');
  const [poster, setPoster] = useState('');
  const [backdrop, setBackdrop] = useState('');
  const [category, setCategory] = useState<string>('K-Drama');
  const [genre, setGenre] = useState('');
  const [cast, setCast] = useState('');
  const [director, setDirector] = useState('');
  const [releaseYear, setReleaseYear] = useState<number>(new Date().getFullYear());
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, targetField: 'poster' | 'backdrop') => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const res = await adminService.uploadFile(file);
      if (targetField === 'poster') setPoster(res.url);
      else setBackdrop(res.url);
      showToast('Image uploaded successfully', 'success');
    } catch (err: any) {
      showToast(err.message || 'Image upload failed', 'error');
    } finally {
      setUploading(false);
    }
  };

  useEffect(() => {
    if (drama) {
      setTitle(drama.title || '');
      setTitleKR(drama.titleKR || '');
      setDescription(drama.description || '');
      setPoster(drama.poster || '');
      setBackdrop(drama.backdrop || drama.poster || '');
      setCategory(drama.category || 'K-Drama');
      setGenre(Array.isArray(drama.genre) ? drama.genre.join(', ') : '');
      setCast(Array.isArray(drama.cast) ? drama.cast.join(', ') : '');
      setDirector(drama.director || '');
      setReleaseYear(drama.releaseYear || new Date().getFullYear());
    }
  }, [drama]);

  if (!isOpen || !drama) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim() || !poster.trim()) {
      showToast('Title, description, and poster URL are required', 'error');
      return;
    }

    setLoading(true);
    try {
      const genreArray = genre.split(',').map((s) => s.trim()).filter(Boolean);
      const castArray = cast.split(',').map((s) => s.trim()).filter(Boolean);

      await dramaService.updateDrama(drama.id, {
        title: title.trim(),
        titleKR: titleKR.trim(),
        description: description.trim(),
        poster: poster.trim(),
        backdrop: backdrop.trim() || poster.trim(),
        category,
        genre: genreArray,
        cast: castArray,
        director: director.trim(),
        releaseYear: Number(releaseYear)
      });

      showToast(`Drama "${title}" updated successfully!`, 'success');
      onSuccess();
    } catch (err: any) {
      showToast(err.message || 'Failed to update drama', 'error');
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
              <Film className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-white">Edit Drama Metadata</h3>
              <p className="text-xs text-slate-400">Modify details, category, genre, cast, backdrop and poster URLs</p>
            </div>
          </div>
          <button
            onClick={onCancel}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Category Selector */}
          <div className="p-3 bg-slate-950/80 rounded-2xl border border-slate-800 space-y-2">
            <label className="font-bold text-slate-200 flex items-center gap-2">
              <Globe className="w-4 h-4 text-[#00C2FF]" /> Drama Category
            </label>
            <div className="flex flex-wrap gap-2 pt-1">
              {DRAMA_CATEGORIES.filter(c => c !== 'All Categories').map((cat) => {
                const active = category === cat;
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setCategory(cat)}
                    className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      active
                        ? 'bg-gradient-to-r from-[#00C2FF] to-[#0047FF] text-black font-extrabold shadow-md shadow-cyan-500/20'
                        : 'bg-slate-900 text-slate-300 border border-slate-700 hover:border-slate-500'
                    }`}
                  >
                    {cat}
                  </button>
                );
              })}
            </div>
          </div>
          {/* Title & Korean Title */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="font-bold text-slate-300">English Title *</label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Crash Landing on You"
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-[#00C2FF]"
              />
            </div>
            <div className="space-y-1.5">
              <label className="font-bold text-slate-300">Korean Title (Hangul)</label>
              <input
                type="text"
                value={titleKR}
                onChange={(e) => setTitleKR(e.target.value)}
                placeholder="e.g. 사랑의 불시착"
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-[#00C2FF]"
              />
            </div>
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <label className="font-bold text-slate-300">Synopsis / Description *</label>
            <textarea
              required
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Write drama synopsis..."
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-[#00C2FF]"
            />
          </div>

          {/* Posters & Backdrops (URL or Upload) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="font-bold text-slate-300">Poster Image (URL or Upload) *</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  required
                  value={poster}
                  onChange={(e) => setPoster(e.target.value)}
                  placeholder="https://..."
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-[#00C2FF]"
                />
                <label className="px-3 py-2 bg-slate-800 border border-slate-700 hover:bg-slate-700 rounded-xl text-slate-200 cursor-pointer flex items-center gap-1 shrink-0 disabled:opacity-50">
                  <Upload className="w-3.5 h-3.5" /> {uploading ? 'Uploading...' : 'File'}
                  <input type="file" accept="image/*" className="hidden" disabled={uploading} onChange={(e) => handleFileUpload(e, 'poster')} />
                </label>
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="font-bold text-slate-300">Backdrop Banner (URL or Upload)</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={backdrop}
                  onChange={(e) => setBackdrop(e.target.value)}
                  placeholder="https://..."
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-[#00C2FF]"
                />
                <label className="px-3 py-2 bg-slate-800 border border-slate-700 hover:bg-slate-700 rounded-xl text-slate-200 cursor-pointer flex items-center gap-1 shrink-0 disabled:opacity-50">
                  <Upload className="w-3.5 h-3.5" /> {uploading ? 'Uploading...' : 'File'}
                  <input type="file" accept="image/*" className="hidden" disabled={uploading} onChange={(e) => handleFileUpload(e, 'backdrop')} />
                </label>
              </div>
            </div>
          </div>

          {/* Genre, Director & Release Year */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="font-bold text-slate-300">Genres (Comma separated)</label>
              <input
                type="text"
                value={genre}
                onChange={(e) => setGenre(e.target.value)}
                placeholder="Romance, Comedy, Thriller"
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-[#00C2FF]"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-bold text-slate-300">Director</label>
              <input
                type="text"
                value={director}
                onChange={(e) => setDirector(e.target.value)}
                placeholder="e.g. Lee Jeong-hyo"
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-[#00C2FF]"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-bold text-slate-300">Release Year</label>
              <input
                type="number"
                value={releaseYear}
                onChange={(e) => setReleaseYear(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white font-bold focus:outline-none focus:border-[#00C2FF]"
              />
            </div>
          </div>

          {/* Cast */}
          <div className="space-y-1.5">
            <label className="font-bold text-slate-300">Cast Members (Comma separated)</label>
            <input
              type="text"
              value={cast}
              onChange={(e) => setCast(e.target.value)}
              placeholder="e.g. Hyun Bin, Son Ye-jin, Seo Ji-hye"
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-[#00C2FF]"
            />
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
                'Update Drama'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
