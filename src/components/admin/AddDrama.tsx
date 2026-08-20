import React, { useState } from 'react';
import { dramaService } from '../../services/dramaService.js';
import { adminService } from '../../services/adminService.js';
import { useToast } from '../../context/ToastContext.js';
import { GENRES, DRAMA_CATEGORIES } from '../../utils/constants.js';
import { Plus, Upload, X, Globe } from 'lucide-react';

interface AddDramaProps {
  onSuccess: () => void;
  onCancel: () => void;
}

export const AddDrama: React.FC<AddDramaProps> = ({ onSuccess, onCancel }) => {
  const { showToast } = useToast();

  const [title, setTitle] = useState('');
  const [titleKR, setTitleKR] = useState('');
  const [description, setDescription] = useState('');
  const [poster, setPoster] = useState('');
  const [backdrop, setBackdrop] = useState('');
  const [category, setCategory] = useState<string>('K-Drama');
  const [selectedGenres, setSelectedGenres] = useState<string[]>(['Romance']);
  const [cast, setCast] = useState('');
  const [director, setDirector] = useState('');
  const [releaseYear, setReleaseYear] = useState(2026);
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, targetField: 'poster' | 'backdrop') => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const res = await adminService.uploadFile(file, undefined, 'temp');
      if (targetField === 'poster') setPoster(res.url);
      else setBackdrop(res.url);
      showToast('Image uploaded successfully', 'success');
    } catch (err: any) {
      showToast(err.message || 'Image upload failed', 'error');
    } finally {
      setUploading(false);
    }
  };

  const toggleGenre = (g: string) => {
    if (g === 'All') return;
    if (selectedGenres.includes(g)) {
      if (selectedGenres.length > 1) {
        setSelectedGenres(selectedGenres.filter((item) => item !== g));
      }
    } else {
      setSelectedGenres([...selectedGenres, g]);
    }
  };

  const handleSubmit = async () => {
    if (!title || !description || !poster) {
      showToast('Title, description and poster are required', 'error');
      return;
    }

    setSubmitting(true);
    try {
      await dramaService.createDrama({
        title,
        titleKR,
        description,
        poster,
        backdrop: backdrop || poster,
        category,
        genre: selectedGenres,
        cast: cast.split(',').map((s) => s.trim()).filter(Boolean),
        director,
        releaseYear: Number(releaseYear)
      });
      showToast('New Drama added to AsianFlix!', 'success');
      onSuccess();
    } catch (err: any) {
      showToast(err.message || 'Error adding drama', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-6 bg-slate-900 rounded-3xl border border-slate-800 space-y-6">
      <div className="flex items-center justify-between pb-4 border-b border-slate-800">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <Plus className="w-5 h-5 text-rose-500" /> Upload / Add New Asian Drama
        </h2>
        <button onClick={onCancel} className="p-1 rounded-lg text-slate-400 hover:text-white">
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="space-y-4 text-xs">
        {/* Category Selection Feature */}
        <div className="p-4 bg-slate-950/80 rounded-2xl border border-slate-800 space-y-2">
          <label className="font-bold text-slate-200 flex items-center gap-2">
            <Globe className="w-4 h-4 text-[#00C2FF]" /> Select Drama Category *
          </label>
          <div className="flex flex-wrap gap-2 pt-1">
            {DRAMA_CATEGORIES.filter(c => c !== 'All Categories').map((cat) => {
              const active = category === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategory(cat)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    active
                      ? 'bg-gradient-to-r from-[#00C2FF] to-[#0047FF] text-black shadow-lg shadow-cyan-500/30'
                      : 'bg-slate-900 text-slate-300 border border-slate-700 hover:border-slate-500 hover:text-white'
                  }`}
                >
                  {cat}
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="font-semibold text-slate-300">Drama Title (English)</label>
            <input
              type="text"
              required
              placeholder="e.g. Queen of Tears / Tere Bin / Ertugrul"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-100 outline-none focus:border-rose-500"
            />
          </div>

          <div className="space-y-1">
            <label className="font-semibold text-slate-300">Original Title (Korean/Urdu/Chinese/Turkish)</label>
            <input
              type="text"
              placeholder="e.g. 눈물의 여왕 / تیرے بن"
              value={titleKR}
              onChange={(e) => setTitleKR(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-100 outline-none focus:border-rose-500"
            />
          </div>
        </div>

        <div className="space-y-1">
          <label className="font-semibold text-slate-300">Synopsis / Description</label>
          <textarea
            rows={3}
            required
            placeholder="Plot summary of the drama..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-100 outline-none focus:border-rose-500"
          />
        </div>

        {/* Poster & Backdrop URLs or Upload */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="font-semibold text-slate-300">Poster Image (URL or Upload)</label>
            <div className="flex gap-2">
              <input
                type="text"
                required
                placeholder="https://..."
                value={poster}
                onChange={(e) => setPoster(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-100 outline-none focus:border-rose-500"
              />
              <label className="px-3 py-2 bg-slate-800 border border-slate-700 hover:bg-slate-700 rounded-xl text-slate-200 cursor-pointer flex items-center gap-1 shrink-0">
                <Upload className="w-3.5 h-3.5" /> File
                <input type="file" accept="image/*" onChange={(e) => handleFileUpload(e, 'poster')} className="hidden" onClick={(e) => { e.stopPropagation(); }} />
              </label>
            </div>
          </div>

          <div className="space-y-1">
            <label className="font-semibold text-slate-300">Backdrop Banner Image (URL or Upload)</label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="https://..."
                value={backdrop}
                onChange={(e) => setBackdrop(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-100 outline-none focus:border-rose-500"
              />
              <label className="px-3 py-2 bg-slate-800 border border-slate-700 hover:bg-slate-700 rounded-xl text-slate-200 cursor-pointer flex items-center gap-1 shrink-0">
                <Upload className="w-3.5 h-3.5" /> File
                <input type="file" accept="image/*" onChange={(e) => handleFileUpload(e, 'backdrop')} className="hidden" onClick={(e) => { e.stopPropagation(); }} />
              </label>
            </div>
          </div>
        </div>

        {/* Genres Multi-select */}
        <div className="space-y-1">
          <label className="font-semibold text-slate-300 block">Genres (Select multiple)</label>
          <div className="flex flex-wrap gap-1.5">
            {GENRES.filter((g) => g !== 'All').map((g) => {
              const selected = selectedGenres.includes(g);
              return (
                <button
                  key={g}
                  type="button"
                  onClick={() => toggleGenre(g)}
                  className={`px-3 py-1 rounded-lg text-xs transition-all ${
                    selected
                      ? 'bg-rose-600 text-white font-semibold'
                      : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-slate-200'
                  }`}
                >
                  {g}
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="space-y-1">
            <label className="font-semibold text-slate-300">Cast Members (comma separated)</label>
            <input
              type="text"
              placeholder="Wahaj Ali, Yumna Zaidi / Kim Soo-hyun"
              value={cast}
              onChange={(e) => setCast(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-100 outline-none focus:border-rose-500"
            />
          </div>

          <div className="space-y-1">
            <label className="font-semibold text-slate-300">Director</label>
            <input
              type="text"
              placeholder="e.g. Siraj ul Haq / Jang Young-woo"
              value={director}
              onChange={(e) => setDirector(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-100 outline-none focus:border-rose-500"
            />
          </div>

          <div className="space-y-1">
            <label className="font-semibold text-slate-300">Release Year</label>
            <input
              type="number"
              value={releaseYear}
              onChange={(e) => setReleaseYear(parseInt(e.target.value) || 2026)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-100 outline-none focus:border-rose-500"
            />
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
            type="button"
            onClick={handleSubmit}
            disabled={submitting || uploading}
            className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold shadow-lg shadow-rose-600/30 disabled:opacity-50 cursor-pointer"
          >
            {submitting ? 'Saving...' : 'Create Drama'}
          </button>
        </div>
      </div>
    </div>
  );
};
