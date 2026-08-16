import { QueryClient } from '@tanstack/react-query';
import { User, Drama, Episode, WatchHistoryItem, Rating, Avatar, DashboardStats, RealtimeStats, DramaAnalytics, UserEngagement, ContentPerformance, UserRetention, Subtitle, DramaDetailResponse } from '../types.js';

const API_BASE_URL = '/api';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      gcTime: 10 * 60 * 1000,
      retry: (failureCount, error) => {
        if (failureCount >= 3) return false;
        if (error instanceof Error && (error.message.includes('401') || error.message.includes('SESSION_EXPIRED'))) return false;
        return true;
      },
      refetchOnWindowFocus: false,
    },
  },
});

interface RequestConfig extends RequestInit {
  params?: Record<string, string | number | boolean | undefined>;
}

export async function apiRequest<T>(
  endpoint: string,
  config: RequestConfig = {}
): Promise<T> {
  const { params, ...options } = config;
  
  const url = new URL(`${API_BASE_URL}${endpoint}`, window.location.origin);
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        url.searchParams.append(key, String(value));
      }
    });
  }

  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string>),
  };

  if (!(options.body instanceof FormData) && !(options.body instanceof URLSearchParams)) {
    headers['Content-Type'] = 'application/json';
  }

  const response = await fetch(url.toString(), {
    ...options,
    headers,
    credentials: 'include',
  });

  const contentType = response.headers.get('content-type');
  if (!contentType || !contentType.includes('application/json')) {
    const text = await response.text();
    throw new Error(`API returned non-JSON response: ${text.slice(0, 200)}`);
  }

  const data = await response.json();

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error(data?.message || 'SESSION_EXPIRED');
    }
    throw new Error(data.message || `API error (${response.status})`);
  }

  return data as T;
}

export const api = {
  get: <T>(endpoint: string, params?: Record<string, unknown>) =>
    apiRequest<T>(endpoint, { method: 'GET', params: params as Record<string, string | number | boolean | undefined> }),

  post: <T>(endpoint: string, body: unknown) =>
    apiRequest<T>(endpoint, { method: 'POST', body: JSON.stringify(body) }),

  put: <T>(endpoint: string, body: unknown) =>
    apiRequest<T>(endpoint, { method: 'PUT', body: JSON.stringify(body) }),

  patch: <T>(endpoint: string, body: unknown) =>
    apiRequest<T>(endpoint, { method: 'PATCH', body: JSON.stringify(body) }),

  delete: <T>(endpoint: string, body?: unknown) =>
    apiRequest<T>(endpoint, { method: 'DELETE', body: body ? JSON.stringify(body) : undefined }),

  upload: <T>(endpoint: string, formData: FormData) =>
    apiRequest<T>(endpoint, { method: 'POST', body: formData }),
};

export const authApi = {
  login: (email: string, password: string) =>
    api.post<{ user: User; accessToken: string }>('/auth/login', { email, password }),

  register: (name: string, email: string, password: string, confirmPassword: string) =>
    api.post<{ user: User; accessToken: string }>('/auth/register', { name, email, password, confirmPassword }),

  logout: () =>
    api.post('/auth/logout', {}),

  refresh: () =>
    api.post<{ accessToken: string }>('/auth/refresh', {}),

  getMe: () =>
    api.get<{ user: User }>('/auth/me', {}),

  updateProfile: (name?: string, avatar?: string, bio?: string, avatarIndex?: number) =>
    api.put<{ user: User }>('/auth/update', { name, avatar, bio, avatarIndex }),

  changePassword: (currentPassword: string, newPassword: string, confirmPassword: string) =>
    api.put('/auth/password', { currentPassword, newPassword, confirmPassword }),
};

export const userApi = {
  getWatchlist: () =>
    api.get<Drama[]>('/users/watchlist'),

  toggleWatchlist: (dramaId: string) =>
    api.put<{ message: string; watchlist: string[]; added: boolean }>('/users/watchlist', { dramaId }),

  getWatchHistory: () =>
    api.get<WatchHistoryItem[]>('/users/history'),

  updateWatchHistory: (dramaId: string, episodeId: string, progress: number, duration: number) =>
    api.put('/users/history', { dramaId, episodeId, progress, duration }),

  clearWatchHistory: (dramaId?: string) =>
    api.delete('/users/history', { body: dramaId ? { dramaId } : {} }),

  addRating: (dramaId: string, rating: number, review?: string) =>
    api.post('/users/rating', { dramaId, rating, review }),

  getUserRatings: () =>
    api.get<Rating[]>('/users/ratings'),

  getAvailableAvatars: () =>
    api.get<{ avatars: Avatar[] }>('/users/avatars'),

  updateProfile: (name?: string, bio?: string, avatarIndex?: number) =>
    api.put<{ user: User }>('/users/profile', { name, bio, avatarIndex }),

  changePassword: (currentPassword: string, newPassword: string, confirmPassword: string) =>
    api.put('/users/password', { currentPassword, newPassword, confirmPassword }),

  deleteAccount: (password: string) =>
    api.delete('/users/account', { body: { password } }),
};

export const dramaApi = {
  getAll: (params?: { q?: string; category?: string; genre?: string; year?: number; minRating?: number; sort?: string }) =>
    api.get<{ total: number; dramas: Drama[] }>('/dramas', params),

  getTrending: () =>
    api.get<Drama[]>('/dramas/trending'),

  getLatest: () =>
    api.get<Drama[]>('/dramas/latest'),

  getByGenre: (genre: string) =>
    api.get<Drama[]>(`/dramas/genre/${encodeURIComponent(genre)}`),

  getById: (id: string) =>
    api.get<DramaDetailResponse>(`/dramas/${id}`),

  create: (data: Partial<Drama>) =>
    api.post<{ message: string; drama: Drama }>('/dramas', data),

  update: (id: string, data: Partial<Drama>) =>
    api.put<{ message: string; drama: Drama }>(`/dramas/${id}`, data),

  delete: (id: string) =>
    api.delete<{ message: string }>(`/dramas/${id}`),
};

export const episodeApi = {
  getAll: (params?: { dramaId?: string; search?: string }) =>
    api.get<Episode[]>('/episodes', params),

  getByDrama: (dramaId: string) =>
    api.get<Episode[]>(`/episodes/drama/${dramaId}`),

  create: (data: Partial<Episode>) =>
    api.post<{ message: string; episode: Episode }>('/episodes', data),

  update: (id: string, data: Partial<Episode>) =>
    api.put<{ message: string; episode: Episode }>(`/episodes/${id}`, data),

  replaceVideo: (id: string, videoUrl: string) =>
    api.put<{ message: string; episode: Episode }>(`/episodes/${id}/video`, { videoUrl }),

  updateSubtitle: (id: string, subtitles: Subtitle[]) =>
    api.put<{ message: string; episode: Episode }>(`/episodes/${id}/subtitle`, { subtitles }),

  delete: (id: string) =>
    api.delete<{ message: string }>(`/episodes/${id}`),

  reorder: (dramaId: string, episodeIds: string[]) =>
    api.post<{ message: string; episodes: Episode[] }>('/episodes/reorder', { dramaId, episodeIds }),
};

export const adminApi = {
  getDashboardStats: () =>
    api.get<DashboardStats>('/admin/dashboard', {}),

  getAllUsers: () =>
    api.get<User[]>('/admin/users', {}),

  toggleBlockUser: (userId: string) =>
    api.put<{ message: string; isBlocked: boolean }>(`/admin/users/${userId}/block`, {}),

  deleteUser: (userId: string) =>
    api.delete<{ message: string }>(`/admin/users/${userId}`, {}),

  deleteReview: (reviewId: string) =>
    api.delete<{ message: string }>(`/admin/reviews/${reviewId}`, {}),
};

export const analyticsApi = {
  getDashboardStats: () =>
    api.get<DashboardStats>('/analytics/dashboard', {}),

  getRealtimeStats: () =>
    api.get<RealtimeStats>('/analytics/realtime', {}),

  getDramaAnalytics: (dramaId: string, range?: string) =>
    api.get<DramaAnalytics>(`/analytics/drama/${dramaId}`, { range }),

  getUserEngagement: (range?: string) =>
    api.get<UserEngagement>(`/analytics/users/engagement`, { range }),

  getContentPerformance: (range?: string, limit?: number) =>
    api.get<ContentPerformance>(`/analytics/content/performance`, { range, limit }),

  getUserRetention: (range?: string) =>
    api.get<UserRetention>(`/analytics/users/retention`, { range }),

  trackEvent: (type: string, dramaId?: string, episodeId?: string, metadata?: Record<string, unknown>) =>
    api.post('/analytics/track', { type, dramaId, episodeId, metadata }),
};

export const uploadApi = {
  uploadFile: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.upload<{ url: string; filename: string }>('/upload/file', formData);
  },
};

// Cache management utilities
export const cacheUtils = {
  clear: () => queryClient.clear(),
  invalidate: (key: string) => queryClient.invalidateQueries({ queryKey: [key] }),
};