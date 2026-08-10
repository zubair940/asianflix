import React from 'react';
import { Drama } from '../../types.js';
import { Search, Filter, RotateCcw } from 'lucide-react';

interface EpisodeFiltersProps {
  dramas: Drama[];
  selectedDramaId: string;
  onSelectDramaId: (id: string) => void;
  searchQuery: string;
  onSearchQueryChange: (q: string) => void;
  onReset: () => void;
}

export const EpisodeFilters: React.FC<EpisodeFiltersProps> = ({
  dramas,
  selectedDramaId,
  onSelectDramaId,
  searchQuery,
  onSearchQueryChange,
  onReset
}) => {
  const isFiltered = selectedDramaId !== 'all' || searchQuery.trim() !== '';

  return (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-4 rounded-2xl bg-slate-900 border border-slate-800">
      {/* Search Input */}
      <div className="relative flex-1">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchQueryChange(e.target.value)}
          placeholder="Search episode title or episode number..."
          className="w-full pl-10 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#00C2FF] transition-all"
        />
      </div>

      {/* Drama Dropdown Filter */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1 sm:w-64">
          <Filter className="w-4 h-4 text-[#00C2FF] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <select
            value={selectedDramaId}
            onChange={(e) => onSelectDramaId(e.target.value)}
            className="w-full pl-10 pr-8 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs font-semibold text-white focus:outline-none focus:border-[#00C2FF] transition-all appearance-none cursor-pointer"
          >
            <option value="all">🎬 All K-Dramas ({dramas.length})</option>
            {dramas.map((d) => (
              <option key={d.id} value={d.id}>
                {d.title} ({d.releaseYear})
              </option>
            ))}
          </select>
        </div>

        {/* Reset Filters */}
        {isFiltered && (
          <button
            onClick={onReset}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
            title="Reset Filters"
          >
            <RotateCcw className="w-4 h-4 text-rose-400" />
            <span className="hidden sm:inline">Reset</span>
          </button>
        )}
      </div>
    </div>
  );
};
