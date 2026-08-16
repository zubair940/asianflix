import { userApi } from './api.js';
import { Drama, WatchHistoryItem, Rating, Avatar } from '../types.js';

export const userService = {
  getWatchlist: () => {
    return userApi.getWatchlist();
  },

  toggleWatchlist: (dramaId: string) => {
    return userApi.toggleWatchlist(dramaId);
  },

  getWatchHistory: () => {
    return userApi.getWatchHistory();
  },

  updateWatchHistory: (dramaId: string, episodeId: string, progress: number, duration: number) => {
    return userApi.updateWatchHistory(dramaId, episodeId, progress, duration);
  },

  clearWatchHistory: (dramaId?: string) => {
    return userApi.clearWatchHistory(dramaId);
  },

  addRating: (dramaId: string, rating: number, review?: string) => {
    return userApi.addRating(dramaId, rating, review);
  },

  getUserRatings: () => {
    return userApi.getUserRatings();
  },

  getAvailableAvatars: () => {
    return userApi.getAvailableAvatars();
  },

  updateProfile: (name?: string, bio?: string, avatarIndex?: number) => {
    return userApi.updateProfile(name, bio, avatarIndex);
  },

  changePassword: (currentPassword: string, newPassword: string, confirmPassword: string) => {
    return userApi.changePassword(currentPassword, newPassword, confirmPassword);
  },

  deleteAccount: (password: string) => {
    return userApi.deleteAccount(password);
  }
};