import { apiRequest } from './api.js';
import { Drama, WatchHistoryItem } from '../types.js';

export const userService = {
  toggleWatchlist: (dramaId: string) => {
    return apiRequest<{ message: string; watchlist: string[]; added: boolean }>('/users/watchlist', {
      method: 'PUT',
      body: JSON.stringify({ dramaId })
    });
  },

  getWatchlist: () => {
    return apiRequest<Drama[]>('/users/watchlist');
  },

  updateWatchHistory: (dramaId: string, episodeId: string, progress: number, duration: number) => {
    return apiRequest<{ message: string }>('/users/history', {
      method: 'PUT',
      body: JSON.stringify({ dramaId, episodeId, progress, duration })
    });
  },

  getWatchHistory: () => {
    return apiRequest<WatchHistoryItem[]>('/users/history');
  },

  addRating: (dramaId: string, rating: number, review?: string) => {
    return apiRequest<{ message: string; averageRating: number; totalRatingsCount: number }>('/users/rating', {
      method: 'POST',
      body: JSON.stringify({ dramaId, rating, review })
    });
  }
};
