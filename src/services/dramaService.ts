import { apiRequest } from './api.js';
import { Drama, Episode, Rating } from '../types.js';
import { getMediaUrl } from '../utils/helpers.js';

export interface DramaDetailResponse {
  drama: Drama;
  episodes: Episode[];
  reviews: Rating[];
  related: Drama[];
}

export interface HomeData {
  trending: Drama[];
  latest: Drama[];
  all: Drama[];
}

export const dramaService = {
  resolveVideoUrl: (url: string) => {
    return getMediaUrl(url);
  },

  getHome: () => {
    return apiRequest<HomeData>('/dramas/home');
  },

  getAllDramas: (params?: { q?: string; category?: string; genre?: string; year?: number; minRating?: number; sort?: string }) => {
    const query = new URLSearchParams();
    if (params?.q) query.append('q', params.q);
    if (params?.category) query.append('category', params.category);
    if (params?.genre) query.append('genre', params.genre);
    if (params?.year) query.append('year', params.year.toString());
    if (params?.minRating) query.append('minRating', params.minRating.toString());
    if (params?.sort) query.append('sort', params.sort);

    const queryString = query.toString() ? `?${query.toString()}` : '';
    return apiRequest<{ total: number; dramas: Drama[] }>(`/dramas${queryString}`);
  },

  getTrending: () => {
    return apiRequest<Drama[]>('/dramas/trending');
  },

  getLatest: () => {
    return apiRequest<Drama[]>('/dramas/latest');
  },

  getByGenre: (genre: string) => {
    return apiRequest<Drama[]>(`/dramas/genre/${encodeURIComponent(genre)}`);
  },

  getById: (id: string) => {
    return apiRequest<DramaDetailResponse>(`/dramas/${id}`);
  },

  // Admin APIs
  createDrama: (data: Partial<Drama>) => {
    return apiRequest<{ message: string; drama: Drama }>('/dramas', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  updateDrama: (id: string, data: Partial<Drama>) => {
    return apiRequest<{ message: string; drama: Drama }>(`/dramas/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  },

  deleteDrama: (id: string) => {
    return apiRequest<{ message: string }>(`/dramas/${id}`, {
      method: 'DELETE'
    });
  },

  // Episode APIs
  getAllEpisodes: (params?: { dramaId?: string; search?: string }) => {
    const query = new URLSearchParams();
    if (params?.dramaId) query.append('dramaId', params.dramaId);
    if (params?.search) query.append('search', params.search);
    const qStr = query.toString() ? `?${query.toString()}` : '';
    return apiRequest<Episode[]>(`/episodes${qStr}`);
  },

  createEpisode: (data: Partial<Episode>) => {
    return apiRequest<{ message: string; episode: Episode }>('/episodes', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  bulkCreateEpisodes: (items: { dramaId: string; episodeNumber?: number; title?: string; duration?: string; videoUrl: string; thumbnail?: string; subtitles?: { language: string; label: string; url: string }[] }[]) => {
    return apiRequest<{ message: string; created: number; total: number; results: { index: number; success: boolean; episode?: Episode; message?: string }[] }>('/episodes/bulk-upload', {
      method: 'POST',
      body: JSON.stringify(items)
    });
  },

  updateEpisode: (id: string, data: Partial<Episode>) => {
    return apiRequest<{ message: string; episode: Episode }>(`/episodes/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  },

  replaceEpisodeVideo: (id: string, videoUrl: string) => {
    return apiRequest<{ message: string; episode: Episode }>(`/episodes/${id}/video`, {
      method: 'PUT',
      body: JSON.stringify({ videoUrl })
    });
  },

  updateEpisodeSubtitle: (id: string, subtitles: { language: string; label: string; url: string }[]) => {
    return apiRequest<{ message: string; episode: Episode }>(`/episodes/${id}/subtitle`, {
      method: 'PUT',
      body: JSON.stringify({ subtitles })
    });
  },

  deleteEpisode: (id: string) => {
    return apiRequest<{ message: string }>(`/episodes/${id}`, {
      method: 'DELETE'
    });
  },

  reorderEpisodes: (dramaId: string, episodeIds: string[]) => {
    return apiRequest<{ message: string; episodes: Episode[] }>('/episodes/reorder', {
      method: 'POST',
      body: JSON.stringify({ dramaId, episodeIds })
    });
  }
};

