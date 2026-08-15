import React, { memo, useRef, useCallback, useState, useEffect } from 'react';
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

const DramaRow = memo(function DramaRow({ title, subtitle, icon, dramas, historyMap }: DramaRowProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(true);

  const handleScroll = useCallback((direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const { scrollLeft, clientWidth } = scrollRef.current;
      const scrollAmount = clientWidth * 0.85;
      scrollRef.current.scrollTo({
        left: direction === 'left' ? scrollLeft - scrollAmount : scrollLeft + scrollAmount,
        behavior: 'smooth',
      });
    }
  }, []);

  const checkScrollPosition = useCallback(() => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setShowLeftArrow(scrollLeft > 10);
      setShowRightArrow(scrollLeft + clientWidth < scrollWidth - 10);
    }
  }, []);

  useEffect(() => {
    const container = scrollRef.current;
    if (container) {
      container.addEventListener('scroll', checkScrollPosition, { passive: true });
      checkScrollPosition();
      return () => container.removeEventListener('scroll', checkScrollPosition);
    }
  }, [checkScrollPosition]);

  if (!dramas || dramas.length === 0) return null;

  return (
    <section className="relative group/row" aria-labelledby={`row-${title.toLowerCase().replace(/\s+/g, '-')}`}>
      <div className="flex items-end justify-between mb-5 px-4 sm:px-6 lg:px-8">
        <div>
          <div className="flex items-center gap-2.5">
            {icon && <div className="text-rose-500 flex-shrink-0">{icon}</div>}
            <h2 id={`row-${title.toLowerCase().replace(/\s+/g, '-')}`} className="text-xl font-bold text-white tracking-tight flex-shrink-0">
              {title}
            </h2>
          </div>
          {subtitle && <p className="text-sm text-gray-400 mt-1 max-w-xs">{subtitle}</p>}
        </div>

        {/* Navigation Arrows */}
        <div className="flex items-center gap-1.5 opacity-0 group-hover/row:opacity-100 transition-opacity duration-300">
          <button
            onClick={() => handleScroll('left')}
            disabled={!showLeftArrow}
            className="btn-icon hidden sm:flex opacity-60 hover:opacity-100 disabled:opacity-0 disabled:pointer-events-none transition-opacity"
            aria-label={`Scroll ${title} left`}
          >
            <ChevronLeft className="w-5 h-5" aria-hidden="true" />
          </button>
          <button
            onClick={() => handleScroll('right')}
            disabled={!showRightArrow}
            className="btn-icon hidden sm:flex opacity-60 hover:opacity-100 disabled:opacity-0 disabled:pointer-events-none transition-opacity"
            aria-label={`Scroll ${title} right`}
          >
            <ChevronRight className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>
      </div>

      {/* Horizontal Scroll Grid */}
      <div
        ref={scrollRef}
        className="flex gap-4 overflow-x-auto scrollbar-none px-4 sm:px-6 lg:px-8 pb-6 scroll-smooth touch-pan-x"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        onScroll={checkScrollPosition}
        role="list"
        aria-label={`${title} dramas`}
      >
        {dramas.map((drama) => (
          <div key={drama.id} className="w-[170px] sm:w-[190px] md:w-[210px] lg:w-[220px] shrink-0" role="listitem">
            <DramaCard drama={drama} historyItem={historyMap ? historyMap[drama.id] : undefined} />
          </div>
        ))}
      </div>

      {/* Mobile Scroll Indicators */}
      <div className="hidden sm:hidden flex items-center justify-between px-4">
        <button
          onClick={() => handleScroll('left')}
          disabled={!showLeftArrow}
          className="btn-icon opacity-60 disabled:opacity-0 disabled:pointer-events-none"
          aria-label={`Scroll ${title} left`}
        >
          <ChevronLeft className="w-5 h-5" aria-hidden="true" />
        </button>
        <span className="text-xs text-gray-500 px-2">Swipe to explore</span>
        <button
          onClick={() => handleScroll('right')}
          disabled={!showRightArrow}
          className="btn-icon opacity-60 disabled:opacity-0 disabled:pointer-events-none"
          aria-label={`Scroll ${title} right`}
        >
          <ChevronRight className="w-5 h-5" aria-hidden="true" />
        </button>
      </div>
    </section>
  );
});

DramaRow.displayName = 'DramaRow';

export { DramaRow };