import { apiRequest } from './api.js';
import { DashboardStats, User } from '../types.js';

function xhrUpload(
  url: string,
  method: string,
  file: File | FormData,
  headers: Record<string, string>,
  onProgress?: (percent: number) => void
): Promise<{ ok: boolean; status: number; json: any }> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open(method, url, true);
    Object.entries(headers).forEach(([k, v]) => xhr.setRequestHeader(k, v));
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && onProgress) {
        onProgress(Math.round((e.loaded / e.total) * 100));
      }
    };
    xhr.onload = () => {
      let json: any = null;
      try {
        json = JSON.parse(xhr.responseText);
      } catch {
        json = null;
      }
      resolve({ ok: xhr.status >= 200 && xhr.status < 300, status: xhr.status, json });
    };
    xhr.onerror = () => reject(new Error('Network error during upload'));
    xhr.onabort = () => reject(new Error('Upload aborted'));
    xhr.send(file);
  });
}

export const adminService = {
  getDashboardStats: () => {
    return apiRequest<DashboardStats>('/admin/dashboard');
  },

  // Local media server config is cached for the page lifetime — it never
  // changes while the site is running.
  _mediaServerUrlCache: undefined as string | null | undefined,

  _getMediaServerUrl: async (): Promise<string | null> => {
    if (adminService._mediaServerUrlCache !== undefined) return adminService._mediaServerUrlCache;
    try {
      const res = await apiRequest<{ mediaServerUrl: string | null }>('/dramas/media-config');
      adminService._mediaServerUrlCache = res?.mediaServerUrl || null;
    } catch {
      adminService._mediaServerUrlCache = null;
    }
    return adminService._mediaServerUrlCache;
  },

  getAllUsers: () => {
    return apiRequest<User[]>('/admin/users');
  },

  toggleBlockUser: (userId: string) => {
    return apiRequest<{ message: string; isBlocked: boolean }>(`/admin/users/${userId}/block`, {
      method: 'PUT'
    });
  },

  deleteUser: (userId: string) => {
    return apiRequest<{ message: string }>(`/admin/users/${userId}`, {
      method: 'DELETE'
    });
  },

  deleteReview: (reviewId: string) => {
    return apiRequest<{ message: string }>(`/admin/reviews/${reviewId}`, {
      method: 'DELETE'
    });
  },

  // Uploads a file DIRECTLY from the browser to the local media server (your
  // PC, exposed via Cloudflare Tunnel). NO cloud storage is used.
  //
  // mediaPath is an optional folder hint stored under uploads/ on the PC:
  //   'temp'                     -> temp/<uuid>.<ext>
  //   'dramas/<dramaId>'          -> dramas/<dramaId>/<uuid>.<ext>
  //   'dramas/<dramaId>/poster.jpg' -> dramas/<dramaId>/poster.jpg (explicit)
  //
  // If the media server is offline, small files (images/subtitles) fall back
  // to the server proxy (local disk, dev only). Videos refuse to proxy
  // through the serverless function (request body limits).
  uploadFile: async (file: File, onProgress?: (percent: number) => void, mediaPath?: string) => {
    const isVideo = /^video\//.test(file.type);
    const mediaServerUrl = await adminService._getMediaServerUrl();

    if (mediaServerUrl) {
      const formData = new FormData();
      formData.append('file', file);
      if (mediaPath) formData.append('path', mediaPath);
      const res = await xhrUpload(`${mediaServerUrl}/api/upload`, 'POST', formData, {}, onProgress);
      if (!res.ok) {
        throw new Error(res.json?.message || `Upload failed (${res.status})`);
      }
      return { url: res.json.url, filename: res.json.filename };
    }

    if (!isVideo) {
      const formData = new FormData();
      formData.append('file', file);
      const res = await xhrUpload('/api/upload/file', 'POST', formData, {}, onProgress);
      if (!res.ok) {
        throw new Error(res.json?.message || `Upload failed (${res.status})`);
      }
      return { url: res.json.url, filename: res.json.filename };
    }

    throw new Error(
      'Media server offline. Start `npm run media-server` on your PC, expose it with a Cloudflare Tunnel, and set MEDIA_SERVER_URL in Vercel.'
    );
  }
};