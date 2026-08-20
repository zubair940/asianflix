import React, { Suspense, lazy, useState, useEffect } from 'react';

interface LazyWithRetryProps {
  importFn: () => Promise<{ default: React.ComponentType<any> }>;
  fallback?: React.ReactNode;
  maxRetries?: number;
  retryDelay?: number;
}

export function LazyWithRetry({
  importFn,
  fallback = <div className="min-h-[60vh] flex items-center justify-center">Loading...</div>,
  maxRetries = 3,
  retryDelay = 1000
}: LazyWithRetryProps) {
  const [attempt, setAttempt] = useState(0);
  const [error, setError] = useState<Error | null>(null);
  const [Component, setComponent] = useState<React.ComponentType<any> | null>(null);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const module = await importFn();
        if (!cancelled) {
          setComponent(() => module.default);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err as Error);
        }
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, [attempt]);

  if (error) {
    if (attempt < maxRetries) {
      setTimeout(() => setAttempt(a => a + 1), retryDelay * (attempt + 1));
      return <div className="min-h-[60vh] flex items-center justify-center gap-4 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-4 border-cyan-500 border-t-transparent" />
        <p className="text-slate-400">Retrying... (attempt {attempt + 1}/{maxRetries})</p>
      </div>;
    }

    return <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4 p-8 text-center">
      <h2 className="text-lg font-bold text-white">Failed to load page</h2>
      <p className="text-sm text-slate-400 max-w-md break-words">{error.message}</p>
      <button
        onClick={() => { setError(null); setAttempt(0); }}
        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-rose-600 to-pink-600 text-white font-semibold cursor-pointer"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
        Retry
      </button>
    </div>;
  }

  if (!Component) {
    return <Suspense fallback={fallback}>{fallback}</Suspense>;
  }

  return <Component />;
}

export function lazyWithRetry<T extends React.ComponentType<any>>(
  importFn: () => Promise<{ default: T }>,
  options?: { maxRetries?: number; retryDelay?: number }
) {
  return function LazyWithRetryWrapper(props: any) {
    return <LazyWithRetry importFn={importFn} maxRetries={options?.maxRetries} retryDelay={options?.retryDelay} />;
  };
}