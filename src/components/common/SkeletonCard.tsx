import React from 'react';

export const SkeletonCard: React.FC = () => {
  return (
    <div className="rounded-xl bg-slate-900 border border-slate-800 overflow-hidden animate-pulse">
      <div className="aspect-[2/3] bg-slate-800 w-full"></div>
      <div className="p-3 space-y-2">
        <div className="h-4 bg-slate-800 rounded w-3/4"></div>
        <div className="h-3 bg-slate-800/60 rounded w-1/2"></div>
        <div className="flex justify-between items-center pt-2">
          <div className="h-3 bg-slate-800 rounded w-1/4"></div>
          <div className="h-3 bg-slate-800 rounded w-1/4"></div>
        </div>
      </div>
    </div>
  );
};
