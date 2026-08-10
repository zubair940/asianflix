import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { dramaService } from '../services/dramaService.js';
import { Drama } from '../types.js';
import { DramaCard } from '../components/homepage/DramaCard.js';
import { FilterSidebar } from '../components/search/FilterSidebar.js';
import { SkeletonCard } from '../components/common/SkeletonCard.js';
import { EmptyState } from '../components/common/EmptyState.js';
import { Search, SlidersHorizontal, Film, X } from 'lucide-react';

export const SearchPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || 'All');
  const [selectedGenre, setSelectedGenre] = useState(searchParams.get('genre') || 'All');
  const [selectedYear, setSelectedYear] = useState<number | null>(
    searchParams.get('year') ? parseInt(searchParams.get('year')!) : null
  );
  const [minRating, setMinRating] = useState<number | null>(
    searchParams.get('minRating') ? parseFloat(searchParams.get('minRating')!) : null
  );
  const [selectedSort, setSelectedSort] = useState(searchParams.get('sort') || 'latest');

  const [dramas, setDramas] = useState<Drama[]>([]);
  const [suggestions, setSuggestions] = useState<Drama[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showMobileFilter, setShowMobileFilter] = useState(false);
  const [loading, setLoading] = useState(true);

  // Debounced Search Effect
  useEffect(() => {
    const handler = setTimeout(() => {
      fetchResults();
    }, 300);

    return () => clearTimeout(handler);
  }, [query, selectedCategory, selectedGenre, selectedYear, minRating, selectedSort]);

  const fetchResults = async () => {
    setLoading(true);
    try {
      const res = await dramaService.getAllDramas({
        q: query,
        category: selectedCategory,
        genre: selectedGenre,
        year: selectedYear || undefined,
        minRating: minRating || undefined,
        sort: selectedSort
      });
      setDramas(res.dramas);

      if (query.trim().length > 1) {
        setSuggestions(res.dramas.slice(0, 5));
      } else {
        setSuggestions([]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleResetFilters = () => {
    setQuery('');
    setSelectedCategory('All');
    setSelectedGenre('All');
    setSelectedYear(null);
    setMinRating(null);
    setSelectedSort('latest');
    setSearchParams({});
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pt-24 pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Search Header */}
        <div className="space-y-4 max-w-2xl mx-auto text-center">
          <h1 className="text-3xl font-black text-white tracking-tight">
            Explore & Search Asian Dramas
          </h1>
          <p className="text-xs text-slate-400">Search K-Dramas, C-Dramas, Pakistani Dramas, Turkish Dramas & more by title, actor, director or genre.</p>

          {/* Smart Search Bar with Auto-Suggestions */}
          <div className="relative">
            <input
              type="text"
              placeholder="Search e.g. Crash Landing, Hyun Bin, Romance..."
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setShowSuggestions(true);
              }}
              onFocus={() => setShowSuggestions(true)}
              className="w-full bg-slate-900 border border-slate-800 focus:border-rose-500 rounded-2xl py-3.5 pl-12 pr-10 text-sm text-white placeholder-slate-500 shadow-2xl outline-none"
            />
            <Search className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
            {query && (
              <button
                onClick={() => setQuery('')}
                className="p-1 rounded-lg text-slate-400 hover:text-white absolute right-3 top-1/2 -translate-y-1/2"
              >
                <X className="w-4 h-4" />
              </button>
            )}

            {/* Auto-suggestions dropdown */}
            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-slate-900 border border-slate-800 rounded-2xl p-2 shadow-2xl z-50 text-left space-y-1">
                <div className="text-[10px] font-bold text-slate-500 px-3 py-1 uppercase tracking-wider">
                  Suggestions
                </div>
                {suggestions.map((s) => (
                  <div
                    key={s.id}
                    onClick={() => {
                      setQuery(s.title);
                      setShowSuggestions(false);
                    }}
                    className="flex items-center gap-3 p-2 rounded-xl hover:bg-slate-800 cursor-pointer transition-colors"
                  >
                    <img src={s.poster} alt={s.title} className="w-8 h-12 rounded object-cover" />
                    <div>
                      <h4 className="text-xs font-bold text-white">{s.title}</h4>
                      <span className="text-[10px] text-rose-400">{s.releaseYear} • {s.genre.slice(0, 2).join(', ')}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Mobile Filter Toggle */}
        <div className="lg:hidden flex justify-end">
          <button
            onClick={() => setShowMobileFilter(!showMobileFilter)}
            className="px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-200 text-xs font-bold flex items-center gap-2"
          >
            <SlidersHorizontal className="w-4 h-4 text-rose-500" /> Filter Options
          </button>
        </div>

        {/* Content Layout: Filter Sidebar + Drama Grid */}
        <div className="flex flex-col lg:flex-row gap-8 items-start">
          {/* Sidebar Filters */}
          <div className={`w-full lg:w-72 shrink-0 ${showMobileFilter ? 'block' : 'hidden lg:block'}`}>
            <FilterSidebar
              selectedCategory={selectedCategory}
              onSelectCategory={setSelectedCategory}
              selectedGenre={selectedGenre}
              onSelectGenre={setSelectedGenre}
              selectedYear={selectedYear}
              onSelectYear={setSelectedYear}
              minRating={minRating}
              onSelectMinRating={setMinRating}
              selectedSort={selectedSort}
              onSelectSort={setSelectedSort}
              onReset={handleResetFilters}
            />
          </div>

          {/* Results Grid */}
          <div className="flex-1 w-full space-y-4">
            <div className="flex items-center justify-between text-xs text-slate-400 font-semibold border-b border-slate-800/80 pb-3">
              <span>Showing {dramas.length} Dramas</span>
              <div className="flex items-center gap-2">
                {selectedCategory !== 'All' && <span className="text-[#00C2FF] font-bold">Category: {selectedCategory}</span>}
                {selectedGenre !== 'All' && <span className="text-rose-400 font-bold">Genre: {selectedGenre}</span>}
              </div>
            </div>

            {loading ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {Array.from({ length: 8 }).map((_, i) => (
                  <SkeletonCard key={i} />
                ))}
              </div>
            ) : dramas.length === 0 ? (
              <div className="bg-slate-900/40 rounded-3xl border border-slate-800/80 p-4">
                <EmptyState
                  icon="search"
                  title={query ? `No dramas found for "${query}"` : "No dramas found"}
                  description={query || selectedGenre !== 'All' ? "Try adjusting your search query, genre, or rating filter." : "The database currently has 0 uploaded K-Dramas."}
                  actionText="Clear All Filters"
                  onActionClick={handleResetFilters}
                  showAdminPrompt={true}
                />
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {dramas.map((drama) => (
                  <DramaCard key={drama.id} drama={drama} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
