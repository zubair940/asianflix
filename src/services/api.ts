// API Service with Request Caching, Deduplication & Error Handling
const API_BASE_URL = '/api';

interface RequestCacheEntry {
  data: any;
  timestamp: number;
  promise?: Promise<any>;
}

class APICache {
  private cache = new Map<string, RequestCacheEntry>();
  private readonly TTL = 5 * 60 * 1000; // 5 minutes
  private pendingRequests = new Map<string, Promise<any>>();

  get(key: string): any | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    if (Date.now() - entry.timestamp > this.TTL) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  set(key: string, data: any): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
    });
  }

  // Request deduplication - returns existing promise if same request is in flight
  getOrCreatePromise(key: string, fetcher: () => Promise<any>): Promise<any> {
    const existing = this.pendingRequests.get(key);
    if (existing) {
      return existing;
    }

    const promise = fetcher().finally(() => {
      this.pendingRequests.delete(key);
    });

    this.pendingRequests.set(key, promise);
    return promise;
  }

  clear(): void {
    this.cache.clear();
    this.pendingRequests.clear();
  }

  invalidate(pattern: string): void {
    for (const key of this.cache.keys()) {
      if (key.includes(pattern)) {
        this.cache.delete(key);
      }
    }
  }
}

const apiCache = new APICache();

export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {},
  cacheKey?: string
): Promise<T> {
  const token = localStorage.getItem('kdramabox_token');

  const headers: Record<string, string> = {
    ...((options.headers as Record<string, string>) || {}),
  };

  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const cacheKeyFinal = cacheKey || `${options.method || 'GET'}:${endpoint}`;

  // For GET requests, check cache first
  if ((!options.method || options.method === 'GET') && options.body === undefined) {
    const cached = apiCache.get(cacheKeyFinal);
    if (cached) {
      return cached as T;
    }
  }

  const fetchFn = async (): Promise<T> => {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    // Handle non-JSON responses (e.g., HTML error pages)
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      const text = await response.text();
      throw new Error(`API returned non-JSON response: ${text.slice(0, 200)}`);
    }

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || `API error (${response.status})`);
    }

    // Cache successful GET responses
    if ((!options.method || options.method === 'GET') && options.body === undefined) {
      apiCache.set(cacheKeyFinal, data);
    }

    return data as T;
  };

  // Deduplicate concurrent identical requests
  return apiCache.getOrCreatePromise(cacheKeyFinal, fetchFn);
}

// Specialized API methods with automatic cache invalidation
export const api = {
  get: <T>(endpoint: string, cacheKey?: string) =>
    apiRequest<T>(endpoint, { method: 'GET' }, cacheKey),

  post: <T>(endpoint: string, body: any, cacheKey?: string) =>
    apiRequest<T>(endpoint, { method: 'POST', body: JSON.stringify(body) }, cacheKey),

  put: <T>(endpoint: string, body: any, cacheKey?: string) => {
    // Invalidate related GET caches on mutation
    const baseEndpoint = endpoint.split('/')[1]; // e.g., 'dramas', 'episodes'
    if (baseEndpoint) apiCache.invalidate(baseEndpoint);
    return apiRequest<T>(endpoint, { method: 'PUT', body: JSON.stringify(body) }, cacheKey);
  },

  delete: <T>(endpoint: string, cacheKey?: string) => {
    const baseEndpoint = endpoint.split('/')[1];
    if (baseEndpoint) apiCache.invalidate(baseEndpoint);
    return apiRequest<T>(endpoint, { method: 'DELETE' }, cacheKey);
  },

  upload: <T>(endpoint: string, formData: FormData, cacheKey?: string) =>
    apiRequest<T>(endpoint, { method: 'POST', body: formData }, cacheKey),
};

// Cache management utilities
export const cacheUtils = {
  clear: () => apiCache.clear(),
  invalidate: (pattern: string) => apiCache.invalidate(pattern),
  invalidateDrama: (dramaId?: string) => {
    apiCache.invalidate('dramas');
    if (dramaId) apiCache.invalidate(dramaId);
  },
  invalidateEpisodes: (dramaId?: string) => {
    apiCache.invalidate('episodes');
    if (dramaId) apiCache.invalidate(dramaId);
  },
  invalidateUser: () => apiCache.invalidate('auth'),
};