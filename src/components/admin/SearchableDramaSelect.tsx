import React, { useState, useRef, useEffect, useMemo, memo } from 'react';
import { Drama } from '../../types.js';
import { Search, ChevronDown, ChevronUp, X, Film, Check, Plus } from 'lucide-react';
import { SmartImage } from '../common/SmartImage.js';

interface SearchableDramaSelectProps {
  dramas: Drama[];
  value: string;
  onChange: (dramaId: string) => void;
  placeholder?: string;
  label?: string;
  disabled?: boolean;
  showEpisodeCount?: boolean;
  onCreateNew?: () => void;
}

const SearchableDramaSelect = memo(function SearchableDramaSelect({
  dramas,
  value,
  onChange,
  placeholder = 'Search or select a drama...',
  label = 'Select Drama',
  disabled = false,
  showEpisodeCount = false,
  onCreateNew,
}: SearchableDramaSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const filteredDramas = useMemo(() => {
    if (!searchQuery.trim()) return dramas;
    const q = searchQuery.toLowerCase().trim();
    return dramas.filter(
      (d) =>
        d.title.toLowerCase().includes(q) ||
        d.titleKR?.toLowerCase().includes(q) ||
        d.genre.some((g) => g.toLowerCase().includes(q)) ||
        d.category?.toLowerCase().includes(q) ||
        d.releaseYear.toString().includes(q)
    );
  }, [dramas, searchQuery]);

  const selectedDrama = dramas.find((d) => d.id === value);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setSearchQuery('');
        setHighlightedIndex(-1);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (isOpen) {
      setHighlightedIndex(-1);
    }
  }, [searchQuery, isOpen]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        setIsOpen(true);
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex((prev) => Math.min(prev + 1, filteredDramas.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex((prev) => Math.max(prev - 1, -1));
        break;
      case 'Enter':
        e.preventDefault();
        if (highlightedIndex >= 0 && filteredDramas[highlightedIndex]) {
          onChange(filteredDramas[highlightedIndex].id);
          setIsOpen(false);
          setSearchQuery('');
          setHighlightedIndex(-1);
        }
        break;
      case 'Escape':
        e.preventDefault();
        setIsOpen(false);
        setSearchQuery('');
        setHighlightedIndex(-1);
        inputRef.current?.blur();
        break;
    }
  };

  const handleOptionClick = (dramaId: string) => {
    onChange(dramaId);
    setIsOpen(false);
    setSearchQuery('');
    setHighlightedIndex(-1);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('');
    setSearchQuery('');
  };

  return (
    <div className="relative" ref={containerRef}>
      <label className="block text-xs font-semibold text-slate-300 mb-1.5">{label}</label>
      <div className="relative">
        <div
          className={`relative w-full bg-slate-950 border rounded-xl transition-all ${
            disabled
              ? 'border-slate-800 opacity-50 cursor-not-allowed'
              : isOpen
              ? 'border-[#00C2FF] ring-1 ring-[#00C2FF]/30'
              : 'border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Film className="w-4 h-4 text-slate-500" aria-hidden="true" />
          </div>
          <input
            ref={inputRef}
            type="text"
            value={searchQuery || (selectedDrama?.title || '')}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              if (!isOpen) setIsOpen(true);
            }}
            onFocus={() => !disabled && setIsOpen(true)}
            onKeyDown={handleKeyDown}
            placeholder={selectedDrama ? '' : placeholder}
            disabled={disabled}
            className={`w-full pl-10 pr-12 py-2.5 bg-transparent text-slate-100 placeholder-slate-500 text-xs outline-none ${
              selectedDrama ? 'font-medium' : ''
            }`}
            aria-autocomplete="list"
            aria-expanded={isOpen}
            aria-controls="drama-options"
            role="combobox"
          />
          {selectedDrama && !disabled && (
            <button
              type="button"
              onClick={handleClear}
              className="absolute right-10 top-1/2 -translate-y-1/2 p-1 rounded text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
              aria-label="Clear selection"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
          <button
            type="button"
            onClick={() => !disabled && setIsOpen(!isOpen)}
            disabled={disabled}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-500 hover:text-white transition-colors disabled:opacity-50"
            aria-label={isOpen ? 'Close' : 'Open'}
          >
            {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>

        {isOpen && !disabled && (
          <div
            id="drama-options"
            className="absolute z-50 mt-1 w-full max-h-96 overflow-y-auto bg-slate-900 border border-slate-700 rounded-xl shadow-2xl scrollbar-none"
            role="listbox"
            aria-label="Available dramas"
          >
            {onCreateNew && (
              <button
                type="button"
                onClick={() => {
                  onCreateNew();
                  setIsOpen(false);
                }}
                className="w-full px-4 py-2.5 text-left flex items-center gap-2 text-sm font-semibold text-cyan-400 hover:bg-cyan-400/10 cursor-pointer border-b border-slate-800"
                role="option"
              >
                <Plus className="w-4 h-4" />
                <span>+ Create New Drama</span>
              </button>
            )}

            {filteredDramas.length === 0 ? (
              <div className="px-4 py-6 text-center text-slate-500 text-xs">
                No dramas found matching "{searchQuery}"
              </div>
            ) : (
              <div role="listbox">
                {filteredDramas.map((drama, index) => (
                  <button
                    key={drama.id}
                    type="button"
                    onClick={() => handleOptionClick(drama.id)}
                    onMouseEnter={() => setHighlightedIndex(index)}
                    className={`w-full px-4 py-2.5 text-left flex items-center gap-3 transition-colors ${
                      index === highlightedIndex
                        ? 'bg-[#00C2FF]/10 text-white'
                        : 'hover:bg-slate-800 text-slate-200'
                    } ${value === drama.id ? 'bg-rose-500/10' : ''}`}
                    role="option"
                    aria-selected={value === drama.id}
                    aria-current={index === highlightedIndex ? 'true' : 'false'}
                  >
                    <SmartImage
                      src={drama.poster}
                      alt=""
                      className="w-8 h-11 rounded object-cover border border-slate-700 flex-shrink-0"
                      loading="lazy"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 truncate">
                        <span className="font-medium truncate">{drama.title}</span>
                        {drama.titleKR && (
                          <span className="text-[10px] text-cyan-400 font-mono whitespace-nowrap">
                            {drama.titleKR}
                          </span>
                        )}
                        {value === drama.id && (
                          <Check className="w-3.5 h-3.5 text-rose-400 flex-shrink-0" aria-hidden="true" />
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-[10px] text-slate-500">
                        <span className="px-1.5 py-0.2 rounded bg-slate-800 border border-slate-700">
                          {drama.category || 'K-Drama'}
                        </span>
                        <span>•</span>
                        <span>{drama.releaseYear}</span>
                        <span>•</span>
                        <span className="truncate max-w-[120px]">{drama.genre.slice(0, 2).join(', ')}</span>
                        {showEpisodeCount && (
                          <>
                            <span>•</span>
                            <span className="text-cyan-400 font-medium">Ep: {drama.episodeCount || '?'}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
});

SearchableDramaSelect.displayName = 'SearchableDramaSelect';

export { SearchableDramaSelect };