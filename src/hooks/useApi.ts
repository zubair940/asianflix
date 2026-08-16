import { useState, useEffect, useCallback, useRef } from 'react';
import { api, cacheUtils, queryClient } from '../services/api.js';
import { Drama, WatchHistoryItem, DashboardStats, User } from '../types.js';

interface UseApiOptions<T> {
  immediate?: boolean;
  onSuccess?: (data: T) => void;
  onError?: (error: Error) => void;
  cacheKey?: string;
  dependencies?: any[];
}

interface UseApiResult<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
  execute: (...args: any[]) => Promise<T | null>;
  refetch: () => Promise<T | null>;
  clearError: () => void;
}

export function useApi<T = any>(
  apiFn: (...args: any[]) => Promise<T>,
  options: UseApiOptions<T> = {}
): UseApiResult<T> {
  const { immediate = true, onSuccess, onError, cacheKey, dependencies = [] } = options;

  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(immediate);
  const [error, setError] = useState<Error | null>(null);

  const mountedRef = useRef(true);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const execute = useCallback(
    async (...args: any[]): Promise<T | null> => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      abortControllerRef.current = new AbortController();

      setLoading(true);
      setError(null);

      try {
        const result = await apiFn(...args);

        if (!mountedRef.current) return null;

        setData(result);
        onSuccess?.(result);
        return result;
      } catch (err: any) {
        if (!mountedRef.current) return null;

        if (err.name === 'AbortError' || err.message?.includes('Aborted')) {
          return null;
        }

        const error = err instanceof Error ? err : new Error(String(err));
        setError(error);
        onError?.(error);
        return null;
      } finally {
        if (mountedRef.current) {
          setLoading(false);
        }
      }
    },
    [apiFn, onSuccess, onError]
  );

  const refetch = useCallback(() => execute(), [execute]);
  const clearError = useCallback(() => setError(null), []);

  useEffect(() => {
    if (immediate) {
      execute();
    }
  }, [immediate, execute, ...dependencies]);

  return { data, loading, error, execute, refetch, clearError };
}

interface DramaListResponse {
  total: number;
  dramas: Drama[];
}

export function useDramaList(params?: {
  q?: string;
  category?: string;
  genre?: string;
  year?: number;
  minRating?: number;
  sort?: string;
}) {
  return useApi<DramaListResponse>(
    () => api.get('/dramas', params),
    { cacheKey: `dramas:${buildQueryString(params)}`, dependencies: [params] }
  );
}

export function useDramaDetail(id: string) {
  return useApi<{
    drama: Drama;
    episodes: any[];
    reviews: any[];
    related: Drama[];
  }>(
    () => api.get(`/dramas/${id}`),
    { cacheKey: `drama:${id}`, dependencies: [id] }
  );
}

export function useTrendingDramas() {
  return useApi<Drama[]>(() => api.get('/dramas/trending'), { cacheKey: 'dramas:trending' });
}

export function useLatestDramas() {
  return useApi<Drama[]>(() => api.get('/dramas/latest'), { cacheKey: 'dramas:latest' });
}

export function useAuthMe() {
  return useApi<{ user: User }>(() => api.get('/auth/me'), { cacheKey: 'auth:me' });
}

export function useDashboardStats() {
  return useApi<DashboardStats>(() => api.get('/admin/dashboard'), { cacheKey: 'admin:dashboard' });
}

export function useAllUsers() {
  return useApi<User[]>(() => api.get('/admin/users'), { cacheKey: 'admin:users' });
}

function buildQueryString(params?: Record<string, any>): string {
  if (!params) return '';
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      searchParams.append(key, String(value));
    }
  });
  return searchParams.toString() ? `?${searchParams.toString()}` : '';
}

export function useMutation<T = any, TVariables = any>(
  mutationFn: (variables: TVariables) => Promise<T>,
  options: {
    onSuccess?: (data: T, variables: TVariables) => void;
    onError?: (error: Error, variables: TVariables) => void;
    invalidateCache?: string[];
  } = {}
) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const execute = useCallback(
    async (variables: TVariables): Promise<T | null> => {
      setLoading(true);
      setError(null);

      try {
        const result = await mutationFn(variables);

        options.invalidateCache?.forEach((pattern) => {
          queryClient.invalidateQueries({ queryKey: [pattern] });
        });

        options.onSuccess?.(result, variables);
        return result;
      } catch (err: any) {
        const error = err instanceof Error ? err : new Error(String(err));
        setError(error);
        options.onError?.(error, variables);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [mutationFn, options]
  );

  return { execute, loading, error, clearError: () => setError(null) };
}