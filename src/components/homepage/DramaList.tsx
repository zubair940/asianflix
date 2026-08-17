import React, { memo, useMemo, useRef, useState, useEffect } from 'react';
import { FixedSizeGrid } from 'react-window';
import { Link } from 'react-router-dom';
import { Drama } from '../../types.js';
import { SmartImage } from '../common/SmartImage.js';

// Virtualized drama grid (react-window) for LONG lists (e.g. 100+ search
// results). Only the visible cells are rendered and mounted, so scrolling
// stays at 60fps even with thousands of dramas. Short lists keep using the
// regular CSS grid — virtualization would only add overhead there.

const MIN_CELL_WIDTH = 150; // px
const MAX_COLUMNS = 6;
const INFO_HEIGHT = 54; // title + year lines below each poster
const OVERSCAN_ROWS = 2;

interface DramaListData {
  dramas: Drama[];
  columns: number;
  cellWidth: number;
  posterHeight: number;
}

interface DramaListProps {
  dramas: Drama[];
}

const Cell = memo(function Cell({ columnIndex, rowIndex, style, data }: any) {
  const { dramas, columns, cellWidth, posterHeight } = data as DramaListData;
  const index = rowIndex * columns + columnIndex;
  const drama = dramas[index];
  if (!drama) return null;

  return (
    <div style={style} className="px-1.5 pb-4">
      <Link to={`/drama/${drama.id}`} className="block group">
        <div
          className="relative overflow-hidden rounded-xl bg-gray-900"
          style={{ height: posterHeight }}
        >
          <SmartImage
            src={drama.poster}
            alt={drama.title}
            loading="lazy"
            decoding="async"
            fetchPriority="low"
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        </div>
        <p className="mt-1.5 text-xs font-bold text-white truncate group-hover:text-cyan-400 transition-colors">
          {drama.title}
        </p>
        <p className="text-[10px] text-gray-500">{drama.releaseYear}</p>
      </Link>
    </div>
  );
});

Cell.displayName = 'DramaListCell';

export const DramaList = memo(function DramaList({ dramas }: DramaListProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new ResizeObserver((entries) => {
      const rect = entries[0]?.contentRect;
      if (rect) setSize({ width: rect.width, height: rect.height });
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const columns = Math.min(MAX_COLUMNS, Math.max(2, Math.floor(size.width / MIN_CELL_WIDTH)));
  const cellWidth = size.width > 0 ? size.width / columns : 0;
  const posterHeight = cellWidth * 1.5;
  const rowHeight = posterHeight + INFO_HEIGHT;
  const rowCount = Math.max(1, Math.ceil(dramas.length / columns));

  const data = useMemo<DramaListData>(
    () => ({ dramas, columns, cellWidth, posterHeight }),
    [dramas, columns, cellWidth, posterHeight]
  );

  // Short list — plain grid is cheaper than virtualization.
  if (dramas.length <= 12 || size.width === 0) {
    return (
      <div ref={containerRef} className="w-full">
        {size.width > 0 && (
          <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
            {dramas.map((drama) => (
              <div key={drama.id} className="px-0">
                <Link to={`/drama/${drama.id}`} className="block group">
                  <div className="relative overflow-hidden rounded-xl bg-gray-900" style={{ height: posterHeight }}>
                    <SmartImage
                      src={drama.poster}
                      alt={drama.title}
                      loading="lazy"
                      decoding="async"
                      fetchPriority="low"
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  </div>
                  <p className="mt-1.5 text-xs font-bold text-white truncate group-hover:text-cyan-400 transition-colors">
                    {drama.title}
                  </p>
                  <p className="text-[10px] text-gray-500">{drama.releaseYear}</p>
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div ref={containerRef} className="w-full">
      <FixedSizeGrid
        columnCount={columns}
        columnWidth={cellWidth}
        rowCount={rowCount}
        rowHeight={rowHeight}
        width={size.width}
        height={size.height}
        overscanRowCount={OVERSCAN_ROWS}
        itemData={data}
        style={{ overflow: 'auto' }}
      >
        {Cell}
      </FixedSizeGrid>
    </div>
  );
});

DramaList.displayName = 'DramaList';