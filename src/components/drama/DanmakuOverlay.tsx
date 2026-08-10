import React, { useEffect, useState, useRef } from 'react';
import { DanmakuComment } from '../../types.js';

interface DanmakuOverlayProps {
  comments: DanmakuComment[];
  currentTime: number;
  isPlaying: boolean;
  enabled: boolean;
}

interface ActiveDanmakuItem extends DanmakuComment {
  topPercent: number;
  animId: string;
}

export const DanmakuOverlay: React.FC<DanmakuOverlayProps> = ({
  comments,
  currentTime,
  isPlaying,
  enabled
}) => {
  const [activeItems, setActiveItems] = useState<ActiveDanmakuItem[]>([]);
  const processedRef = useRef<Set<string>>(new Set());

  // Track comments triggered at current timestamp (within 1.5s window)
  useEffect(() => {
    if (!enabled) {
      setActiveItems([]);
      return;
    }

    // Clear processed if user seeks backward
    const floorTime = Math.floor(currentTime);
    const newItems: ActiveDanmakuItem[] = [];

    comments.forEach((c) => {
      const diff = currentTime - c.timestampSec;
      if (diff >= 0 && diff < 1.2 && !processedRef.current.has(c.id)) {
        processedRef.current.add(c.id);
        const topPercent = Math.floor(Math.random() * 65) + 10; // 10% to 75% height
        newItems.push({
          ...c,
          topPercent,
          animId: `dan_${c.id}_${Date.now()}`
        });
      }
    });

    if (newItems.length > 0) {
      setActiveItems((prev) => [...prev.slice(-15), ...newItems]);
    }
  }, [currentTime, comments, enabled]);

  // Remove expired active items after 8 seconds
  useEffect(() => {
    if (activeItems.length === 0) return;
    const timer = setTimeout(() => {
      setActiveItems((prev) => prev.slice(1));
    }, 8000);
    return () => clearTimeout(timer);
  }, [activeItems]);

  if (!enabled) return null;

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-20 select-none">
      {activeItems.map((item) => (
        <div
          key={item.animId}
          style={{
            top: `${item.topPercent}%`,
            color: item.color || '#00C2FF',
            animationPlayState: isPlaying ? 'running' : 'paused'
          }}
          className="absolute right-0 whitespace-nowrap text-sm sm:text-base font-bold drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)] px-3 py-1 rounded-full bg-black/30 backdrop-blur-xs border border-white/10 animate-danmaku-slide"
        >
          <span className="text-slate-300 font-medium text-xs mr-1 text-opacity-80">
            {item.userName}:
          </span>
          {item.text}
        </div>
      ))}
    </div>
  );
};
