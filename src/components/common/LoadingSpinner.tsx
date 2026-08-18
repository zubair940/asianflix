import React from 'react';

export const LoadingSpinner: React.FC<{ label?: string; size?: 'sm' | 'md' | 'lg' }> = ({
  label = 'Loading K-Dramas...',
  size = 'md',
}) => {
  const sizeClass = size === 'lg' ? 'w-16 h-16' : size === 'sm' ? 'w-8 h-8' : 'w-12 h-12';
  return (
    <div className="flex flex-col items-center justify-center py-20 px-4">
      <div className={`relative ${sizeClass}`}>
        <div className="absolute inset-0 rounded-full border-4 border-slate-800"></div>
        <div className="absolute inset-0 rounded-full border-4 border-rose-500 border-t-transparent animate-spin"></div>
      </div>
      {label && <p className="mt-4 text-xs font-medium text-slate-400 animate-pulse">{label}</p>}
    </div>
  );
};