import { apiRequest } from './api.js';
import { DashboardStats, User } from '../types.js';
import { uploadFileWithStrategy, getUploadMethodDescription, type UploadResult } from '../utils/uploadStrategy.js';

// Chunk size for large files — must stay well under Cloudflare's free tunnel
// per-request body cap (~100MB), otherwise the tunnel kills the request
// mid-upload ("progress 100% then Network error").
const CHUNK_SIZE = 50 * 1024 * 1024; // 50 MB

function newUploadId(): string {
  try {
    if (globalThis.crypto && typeof globalThis.crypto.randomUUID === 'function') {
      return globalThis.crypto.randomUUID();
    }
  } catch {
    /* fall through */
  }
  return `up_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

function xhrUpload(
  url: string,
  method: string,
  body: File | FormData | string | null,
  headers: Record<string, string>,
  onProgress?: (percent: number) => void,
  timeout = 600000
): Promise<{ ok: boolean; status: number; json: any }> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open(method, url, true);
    // Don't set any headers for FormData - browser sets Content-Type with boundary automatically
    Object.entries(headers).forEach(([k, v]) => xhr.setRequestHeader(k, v));

    let lastProgress = 0;
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && onProgress) {
        // Calculate progress
        let percent = Math.round((e.loaded / e.total) * 100);
        // Ensure progress never goes backward
        percent = Math.max(lastProgress, percent);
        // Cap at 100%
        percent = Math.min(percent, 100);
        lastProgress = percent;
        onProgress(percent);
      }
    };

    xhr.onload = () => {
      let json: any = null;
      try {
        json = JSON.parse(xhr.responseText);
      } catch {
        json = { rawResponse: xhr.responseText };
      }
      console.log(`[xhrUpload] ${method} ${url} → ${xhr.status}`, json);
      // Ensure 100% on complete
      if (onProgress) onProgress(100);
      resolve({ ok: xhr.status >= 200 && xhr.status < 300, status: xhr.status, json });
    };

    xhr.onerror = () => {
      console.error(`[xhrUpload] NETWORK ERROR: ${method} ${url}`);
      reject(new Error(`Network error during upload (status: ${xhr.status || 0}). Check CORS, tunnel, or network.`));
    };
    xhr.onabort = () => reject(new Error('Upload aborted'));
    xhr.ontimeout = () => reject(new Error(`Upload timeout after ${Math.round(timeout / 1000)}s — the file may be too large or the connection too slow`));
    xhr.timeout = timeout;
    xhr.send(body as any);
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

  // Chunked upload for large files: slices into <=50MB parts so every single
  // request stays under Cloudflare's free tunnel body cap, then asks the media
  // server to concatenate the parts. Failed chunks resume from where they
  // stopped (the server keeps already-received parts).
  _uploadChunked: async (
    file: File,
    base: string,
    mediaPath: string | undefined,
    onProgress?: (percent: number) => void
  ) => {
    const uploadId = newUploadId();
    const total = Math.max(1, Math.ceil(file.size / CHUNK_SIZE));

    const existingIndexes = async (): Promise<number[]> => {
      try {
        const res = await xhrUpload(`${base}/api/upload/chunks/${uploadId}`, 'GET', null, {});
        return Array.isArray(res.json?.indexes) ? res.json.indexes : [];
      } catch {
        return [];
      }
    };

    let done = 0;
    try {
      done = (await existingIndexes()).length;
    } catch {
      done = 0;
    }
    if (done > 0) console.log(`[uploadChunked] resuming chunked upload ${uploadId} from chunk ${done}`);

    for (let i = done; i < total; i++) {
      const start = i * CHUNK_SIZE;
      const blob = file.slice(start, Math.min(start + CHUNK_SIZE, file.size));
      const formData = new FormData();
      formData.append('uploadId', uploadId);
      formData.append('index', String(i));
      formData.append('total', String(total));
      if (mediaPath) formData.append('path', mediaPath);
      formData.append('file', blob, file.name);

      const chunkProgress = (p: number) => onProgress && onProgress(Math.round(((i + p / 100) / total) * 100));
      let res: { ok: boolean; status: number; json: any };
      try {
        res = await xhrUpload(`${base}/api/upload/chunk`, 'POST', formData, {}, chunkProgress);
      } catch {
        res = await xhrUpload(`${base}/api/upload/chunk`, 'POST', formData, {}, chunkProgress);
      }
      if (!res.ok) {
        throw new Error(res.json?.message || `Chunk ${i + 1}/${total} failed (${res.status})`);
      }
    }

    const completeRes = await xhrUpload(
      `${base}/api/upload/complete`,
      'POST',
      JSON.stringify({ uploadId, filename: file.name, path: mediaPath }),
      { 'Content-Type': 'application/json' }
    );
    if (!completeRes.ok) {
      throw new Error(completeRes.json?.message || `Finalizing upload failed (${completeRes.status})`);
    }
    return { url: completeRes.json.url, filename: completeRes.json.filename };
  },

  // Uploads a file using the best available strategy:
  // 1. Vercel Blob (fast CDN upload) for large files >100MB when token available
  // 2. Chunked upload via Cloudflare Tunnel for files >50MB
  // 3. Direct upload via tunnel for smaller files
  // 4. Fallback to server proxy for non-video files when media server offline
  uploadFile: async (file: File, onProgress?: (percent: number) => void, mediaPath?: string) => {
    const isVideo = /^video\//.test(file.type);
    const mediaServerUrl = await adminService._getMediaServerUrl();

    console.log(`[uploadFile] file=${file.name} (${file.type}, ${file.size} bytes), mediaPath=${mediaPath}, mediaServerUrl=${mediaServerUrl ? 'yes' : 'no'}`);

    // If media server is available, use the smart upload strategy
    if (mediaServerUrl) {
      try {
        const result = await uploadFileWithStrategy({
          file,
          mediaPath,
          onProgress,
          mediaServerUrl,
        });
        console.log(`[uploadFile] completed via ${result.method}: ${result.url}`);
        return { url: result.url, filename: result.filename };
      } catch (error: any) {
        console.error('[uploadFile] Smart upload failed:', error.message);
        throw error;
      }
    }

    // Fallback: media server not configured
    console.warn('[uploadFile] Media server URL not configured, falling back to server proxy');
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