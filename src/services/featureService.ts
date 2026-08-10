import { apiRequest } from './api.js';
import { DanmakuComment, WatchPartyRoom, HeroBanner, UserCollection, Episode } from '../types.js';

export const featureService = {
  // Danmaku
  getDanmaku: (episodeId: string) => {
    return apiRequest<DanmakuComment[]>(`/features/danmaku/${episodeId}`);
  },

  postDanmaku: (episodeId: string, text: string, timestampSec: number, color?: string) => {
    return apiRequest<DanmakuComment>('/features/danmaku', {
      method: 'POST',
      body: JSON.stringify({ episodeId, text, timestampSec, color })
    });
  },

  getAllDanmakuAdmin: () => {
    return apiRequest<DanmakuComment[]>('/features/admin/danmaku');
  },

  deleteDanmaku: (id: string) => {
    return apiRequest<{ message: string }>(`/features/admin/danmaku/${id}`, {
      method: 'DELETE'
    });
  },

  // Watch Party
  createWatchParty: (dramaId: string, episodeId: string, roomName?: string) => {
    return apiRequest<WatchPartyRoom>('/features/watch-party', {
      method: 'POST',
      body: JSON.stringify({ dramaId, episodeId, roomName })
    });
  },

  getWatchParty: (code: string) => {
    return apiRequest<WatchPartyRoom>(`/features/watch-party/${code}`);
  },

  sendWatchPartyMessage: (code: string, text?: string, currentTime?: number, isPlaying?: boolean) => {
    return apiRequest<WatchPartyRoom>(`/features/watch-party/${code}/message`, {
      method: 'POST',
      body: JSON.stringify({ text, currentTime, isPlaying })
    });
  },

  // Hero Banners
  getHeroBanners: () => {
    return apiRequest<HeroBanner[]>('/features/banners');
  },

  saveHeroBanner: (banner: Partial<HeroBanner>) => {
    return apiRequest<HeroBanner>('/features/admin/banners', {
      method: 'POST',
      body: JSON.stringify(banner)
    });
  },

  deleteHeroBanner: (id: string) => {
    return apiRequest<{ message: string }>(`/features/admin/banners/${id}`, {
      method: 'DELETE'
    });
  },

  // Collections
  getCollections: () => {
    return apiRequest<UserCollection[]>('/features/collections');
  },

  createCollection: (title: string, description: string, dramaIds: string[], isPublic = true) => {
    return apiRequest<UserCollection>('/features/collections', {
      method: 'POST',
      body: JSON.stringify({ title, description, dramaIds, isPublic })
    });
  },

  deleteCollection: (id: string) => {
    return apiRequest<{ message: string }>(`/features/collections/${id}`, {
      method: 'DELETE'
    });
  },

  // Bulk Episode Generator
  bulkGenerateEpisodes: (data: { dramaId: string; count: number; startEpNum?: number; duration?: string; defaultVideoUrl?: string }) => {
    return apiRequest<{ message: string; episodes: Episode[] }>('/features/admin/episodes/bulk', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }
};
