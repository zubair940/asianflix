import { apiRequest } from './api.js';
import { DashboardStats, User } from '../types.js';

// Chunk size for large files — must stay well under Cloudflare's free tunnel
// per-request body cap (~100MB), otherwise the tunnel kills the request
// mid-upload ("progress 100% then Network error").
const CHUNK_SIZE = 50 * 1024 * 1024; // 50 MB
// Max concurrent chunk uploads to balance speed vs tunnel stability
const MAX_CONCURRENT_CHUNKS = 3;

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
        json = { rawResponse: xhr.responseText };
      }
      console.log(`[xhrUpload] ${method} ${url} → ${xhr.status}`, json);
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

    // Upload chunks with controlled concurrency and retry logic
    const MAX_RETRIES = 3;
    const RETRY_DELAY_MS = 1000;

    async function uploadChunk(i: number): Promise<void> {
      const start = i * CHUNK_SIZE;
      const blob = file.slice(start, Math.min(start + CHUNK_SIZE, file.size));
      const formData = new FormData();
      formData.append('uploadId', uploadId);
      formData.append('index', String(i));
      formData.append('total', String(total));
      if (mediaPath) formData.append('path', mediaPath);
      formData.append('file', blob, file.name);

      const chunkProgress = (p: number) => onProgress && onProgress(Math.round(((i + p / 100) / total) * 100));

      let lastError: Error | null = null;
      for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
        try {
          const res = await xhrUpload(`${base}/api/upload/chunk`, 'POST', formData, {}, chunkProgress);
          if (res.ok) return;
          lastError = new Error(res.json?.message || `Chunk ${i + 1}/${total} failed (${res.status})`);
        } catch (err: any) {
          lastError = err;
        }
        if (attempt < MAX_RETRIES) {
          console.warn(`[uploadChunked] chunk ${i + 1}/${total} attempt ${attempt} failed, retrying in ${RETRY_DELAY_MS}ms...`);
          await new Promise(r => setTimeout(r, RETRY_DELAY_MS * attempt));
        }
      }
      throw lastError || new Error(`Chunk ${i + 1}/${total} failed after ${MAX_RETRIES} retries`);
    }

    // Controlled concurrency queue
    let nextIndex = done;
    const running = new Set<Promise<void>>();

    async function runQueue(): Promise<void> {
      while (nextIndex < total) {
        if (running.size >= MAX_CONCURRENT_CHUNKS) {
          await Promise.race(running);
          continue;
        }
        const i = nextIndex++;
        const p = uploadChunk(i).then(() => {
          running.delete(p);
        }).catch((err) => {
          running.delete(p);
          throw err;
        });
        running.add(p);
      }
      // Wait for all remaining
      if (running.size > 0) {
        await Promise.all(running);
      }
    }

    await runQueue();

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

    console.log(`[uploadFile] file=${file.name} (${file.type}, ${file.size} bytes), mediaPath=${mediaPath}, mediaServerUrl=${mediaServerUrl}`);

    if (mediaServerUrl) {
      if (file.size > CHUNK_SIZE) {
        return adminService._uploadChunked(file, mediaServerUrl, mediaPath, onProgress);
      }

      const formData = new FormData();
      formData.append('file', file);
      if (mediaPath) formData.append('path', mediaPath);
      
      // Don't set any headers for FormData - browser sets Content-Type with boundary
      const res = await xhrUpload(`${mediaServerUrl}/api/upload`, 'POST', formData, {}, onProgress, isVideo ? 600000 : 300000);
      console.log(`[uploadFile] response:`, res);
      if (!res.ok) {
        const msg = res.json?.message || res.json?.rawResponse || `Upload failed (${res.status})`;
        throw new Error(msg);
      }
      return { url: res.json.url, filename: res.json.filename };
    }

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