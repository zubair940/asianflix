import React from 'react';
import { GENRES, SORT_OPTIONS, YEARS, DRAMA_CATEGORIES } from '../../utils/constants.js';
import { Filter, RotateCcw, Star, Globe } from 'lucide-react';

interface FilterSidebarProps {
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
  selectedGenre: string;
  onSelectGenre: (genre: string) => void;
  selectedYear: number | null;
  onSelectYear: (year: number | null) => void;
  minRating: number | null;
  onSelectMinRating: (rating: number | null) => void;
  selectedSort: string;
  onSelectSort: (sort: string) => void;
  onReset: () => void;
}

export const FilterSidebar: React.FC<FilterSidebarProps> = ({
  selectedCategory,
  onSelectCategory,
  selectedGenre,
  onSelectGenre,
  selectedYear,
  onSelectYear,
  minRating,
  onSelectMinRating,
  selectedSort,
  onSelectSort,
  onReset
}) => {
  return (
    <aside className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-6">
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <Filter className="w-4 h-4 text-rose-500" /> Advanced Filters
        </h3>
        <button
          onClick={onReset}
          className="text-xs text-rose-400 hover:text-rose-300 font-medium flex items-center gap-1 cursor-pointer"
        >
          <RotateCcw className="w-3 h-3" /> Reset
        </button>
      </div>

      {/* Drama Category Filter */}
      <div className="space-y-2">
        <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
          <Globe className="w-3.5 h-3.5 text-[#00C2FF]" /> Drama Category
        </label>
        <div className="flex flex-wrap gap-1.5">
          {DRAMA_CATEGORIES.map((cat) => {
            const active = selectedCategory === cat || (selectedCategory === 'All' && cat === 'All Categories');
            return (
              <button
                key={cat}
                onClick={() => onSelectCategory(cat === 'All Categories' ? 'All' : cat)}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                  active
                    ? 'bg-gradient-to-r from-[#00C2FF] to-[#0047FF] text-black font-bold shadow-md shadow-cyan-500/20'
                    : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-slate-200 hover:border-slate-700'
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>
      </div>

      {/* Sort By */}
      <div className="space-y-2">
        <label className="text-xs font-semibold text-slate-300 block">Sort Order</label>
        <select
          value={selectedSort}
          onChange={(e) => onSelectSort(e.target.value)}
          className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-xl p-2.5 outline-none focus:border-rose-500"
        >
          {SORT_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {/* Genres Filter */}
      <div className="space-y-2">
        <label className="text-xs font-semibold text-slate-300 block">Genre</label>
        <div className="flex flex-wrap gap-1.5">
          {GENRES.map((g) => {
            const active = selectedGenre === g;
            return (
              <button
                key={g}
                onClick={() => onSelectGenre(g)}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                  active
                    ? 'bg-gradient-to-r from-rose-600 to-pink-600 text-white font-semibold shadow-md shadow-rose-600/30'
                    : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-slate-200 hover:border-slate-700'
                }`}
              >
                {g}
              </button>
            );
          })}
        </div>
      </div>

      {/* Release Year Filter */}
      <div className="space-y-2">
        <label className="text-xs font-semibold text-slate-300 block">Release Year</label>
        <select
          value={selectedYear || ''}
          onChange={(e) => onSelectYear(e.target.value ? parseInt(e.target.value) : null)}
          className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-xl p-2.5 outline-none focus:border-rose-500"
        >
          <option value="">All Release Years</option>
          {YEARS.map((y) => (
            <option key={y} value={y}>
              {y}
            </option>
          ))}
        </select>
      </div>

      {/* Minimum Rating Filter */}
      <div className="space-y-2">
        <label className="text-xs font-semibold text-slate-300 block">Minimum Star Rating</label>
        <div className="flex items-center gap-1.5">
          {[4.5, 4.0, 3.5, 3.0].map((r) => {
            const active = minRating === r;
            return (
              <button
                key={r}
                onClick={() => onSelectMinRating(active ? null : r)}
                className={`flex-1 py-1.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-1 transition-all ${
                  active
                    ? 'bg-amber-500 text-slate-950 font-bold'
                    : 'bg-slate-950 text-slate-300 border border-slate-800 hover:border-slate-700'
                }`}
              >
                <Star className="w-3 h-3 fill-current" /> {r}+
              </button>
            );
          })}
        </div>
      </div>
    </aside>
  );
};
