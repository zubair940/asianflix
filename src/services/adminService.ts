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

  uploadFile: async (file: File, onProgress?: (percent: number) => void) => {
    const isVideo = /^video\//.test(file.type);

    // Path 0: local media server (your PC behind a free Cloudflare Tunnel).
    // When MEDIA_SERVER_URL is set on Vercel, the browser uploads DIRECTLY to
    // your PC — Vercel Blob storage is never touched, so the free 1GB quota
    // stays untouched. If the PC is offline, fall through to the cloud paths.
    try {
      const mediaServerUrl = await adminService._getMediaServerUrl();
      if (mediaServerUrl) {
        const formData = new FormData();
        formData.append('file', file);
        const res = await xhrUpload(`${mediaServerUrl}/api/upload`, 'POST', formData, {}, onProgress);
        if (res.ok) {
          return { url: res.json.url, filename: res.json.filename };
        }
        throw new Error(res.json?.message || `Local media server upload failed (${res.status})`);
      }
    } catch (err: any) {
      onProgress?.(0);
      console.warn('[upload] local media server unavailable, falling back:', (err as Error)?.message || err);
    }

    // Path 1: R2 presigned upload straight from the browser to R2.
    // Works on Vercel serverless (no request body size limit, no local
    // filesystem writes) and keeps large files out of the server's memory.
    try {
      const presign = await apiRequest<{ uploadUrl: string; publicUrl: string; key: string }>('/admin/upload/presigned-url', {
        method: 'POST',
        body: JSON.stringify({ fileName: file.name, fileType: file.type || 'application/octet-stream' })
      });

      if (!presign.uploadUrl) {
        throw new Error('R2 not ready');
      }

      const putRes = await xhrUpload(
        presign.uploadUrl,
        'PUT',
        file,
        { 'Content-Type': file.type || 'application/octet-stream', 'X-Requested-With': 'XMLHttpRequest' },
        onProgress
      );

      if (!putRes.ok) {
        throw new Error(`R2 upload failed (${putRes.status})`);
      }

      return { url: presign.publicUrl, filename: presign.key };
    } catch (err: any) {
      const message = (err as Error).message || '';
      const r2Missing = message.includes('not configured') || message.includes('503');

      // Path 2: R2 is not configured — try Vercel Blob (free on Hobby, no
      // credit card). The browser uploads DIRECTLY to Blob using a client
      // token issued by the server. A FRESH token is fetched for every file,
      // and each token is valid for 24h server-side.
      if (r2Missing) {
        // Fetches a fresh client token and uploads the file to Blob.
        const attempt = async () => {
          const tokenRes = await apiRequest<{ token: string; key: string }>('/admin/upload/client-token', {
            method: 'POST',
            body: JSON.stringify({ fileName: file.name, fileType: file.type || 'application/octet-stream' })
          });

          if (!tokenRes.token || !tokenRes.key) {
            throw new Error('Blob not ready');
          }

          const { put } = await import('@vercel/blob/client');
          const blobRes = await put(tokenRes.key, file, {
            access: 'public',
            token: tokenRes.token,
            multipart: isVideo,
            onUploadProgress: (evt: any) => onProgress?.(Math.round(evt?.percentage ?? evt?.progress ?? 0))
          });

          return { url: blobRes.url, filename: blobRes.pathname || tokenRes.key };
        };

        try {
          return await attempt();
        } catch (blobErr: any) {
          const blobMessage = (blobErr as Error).message || '';
          // Token expired mid-upload (very large/slow file) — retry once with
          // a brand-new token before giving up.
          if (blobMessage.toLowerCase().includes('expired')) {
            onProgress?.(0);
            try {
              return await attempt();
            } catch (retryErr: any) {
              throw new Error(`Retry with a fresh token failed: ${(retryErr as Error).message || 'unknown error'}`);
            }
          }
          // Blob is also unavailable — proxy small non-video files through the
          // server (it uses the same unified store). Videos must never be
          // proxied: the request body would exceed serverless limits.
          if (!isVideo) {
            onProgress?.(0);
            const formData = new FormData();
            formData.append('file', file);
            const res = await xhrUpload('/api/upload/file', 'POST', formData, {}, onProgress);
            if (!res.ok) {
              throw new Error(res.json?.message || `Upload failed (${res.status})`);
            }
            return { url: res.json.url, filename: res.json.filename };
          }
          onProgress?.(0);
          throw new Error(blobMessage || 'No cloud storage configured. Enable Vercel Blob (free, no credit card) or R2 to upload videos.');
        }
      }

      // R2 was configured but the upload failed (e.g. bucket CORS) — proxy
      // small non-video files through the unified server store.
      if (!isVideo) {
        onProgress?.(0);
        const formData = new FormData();
        formData.append('file', file);
        const res = await xhrUpload('/api/upload/file', 'POST', formData, {}, onProgress);
        if (!res.ok) {
          throw new Error(res.json?.message || `Upload failed (${res.status})`);
        }
        return { url: res.json.url, filename: res.json.filename };
      }

      onProgress?.(0);
      throw new Error(`Upload failed: ${message || 'presigned upload error'}`);
    }
  }
};
