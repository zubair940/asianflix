import React, { useRef } from 'react';
import { Drama, WatchHistoryItem } from '../../types.js';
import { DramaCard } from './DramaCard.js';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface DramaRowProps {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  dramas: Drama[];
  historyMap?: Record<string, WatchHistoryItem>;
}

export const DramaRow: React.FC<DramaRowProps> = ({ title, subtitle, icon, dramas, historyMap }) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  const handleScroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const { scrollLeft, clientWidth } = scrollRef.current;
      const scrollAmount = clientWidth * 0.75;
      scrollRef.current.scrollTo({
        left: direction === 'left' ? scrollLeft - scrollAmount : scrollLeft + scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  if (!dramas || dramas.length === 0) return null;

  return (
    <section className="my-8 relative group/row">
      <div className="flex items-end justify-between mb-4 px-4 sm:px-6 lg:px-8">
        <div>
          <div className="flex items-center gap-2">
            {icon && <div className="text-rose-500">{icon}</div>}
            <h2 className="text-xl font-bold text-white tracking-tight">{title}</h2>
          </div>
          {subtitle && <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>}
        </div>

        {/* Navigation Arrows */}
        <div className="hidden sm:flex items-center gap-2 opacity-80 group-hover/row:opacity-100 transition-opacity">
          <button
            onClick={() => handleScroll('left')}
            className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:border-rose-500/50 hover:bg-slate-800 transition-all"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={() => handleScroll('right')}
            className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:border-rose-500/50 hover:bg-slate-800 transition-all"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Horizontal Scroll Grid */}
      <div
        ref={scrollRef}
        className="flex gap-4 overflow-x-auto scrollbar-none px-4 sm:px-6 lg:px-8 pb-4 scroll-smooth"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {dramas.map((drama) => (
          <div key={drama.id} className="w-[180px] sm:w-[200px] md:w-[220px] shrink-0">
            <DramaCard drama={drama} historyItem={historyMap ? historyMap[drama.id] : undefined} />
          </div>
        ))}
      </div>
    </section>
  );
};
