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
    Object.entries(headers).forEach(([k, v]) => xhr.setRequestHeader(k, v));

    let lastProgress = 0;
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && onProgress) {
        let percent = Math.round((e.loaded / e.total) * 100);
        percent = Math.max(lastProgress, percent);
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

export type UploadMethod = 'vercel-blob' | 'tunnel-chunked' | 'tunnel-direct' | 'fallback';

export interface UploadResult {
  url: string;
  filename: string;
  method: UploadMethod;
  vercelBlobUrl?: string;
}

export interface UploadStrategyOptions {
  file: File;
  mediaPath?: string;
  onProgress?: (percent: number) => void;
  mediaServerUrl?: string;
  vercelBlobToken?: string;
}

const CHUNK_SIZE = 50 * 1024 * 1024; // 50MB
const VERCEL_BLOB_THRESHOLD = 100 * 1024 * 1024; // 100MB - use Vercel Blob for files larger than this
const MAX_VERCEL_BLOB_SIZE = 2 * 1024 * 1024 * 1024; // 2GB max for Vercel Blob

function hasVercelBlobToken(): boolean {
  return typeof process !== 'undefined' && !!process.env.BLOB_READ_WRITE_TOKEN;
}

function getVercelBlobToken(): string | undefined {
  return typeof process !== 'undefined' ? process.env.BLOB_READ_WRITE_TOKEN : undefined;
}

async function uploadToVercelBlob(
  file: File,
  mediaPath: string | undefined,
  onProgress?: (percent: number) => void
): Promise<{ url: string; filename: string }> {
  const formData = new FormData();
  formData.append('file', file);
  if (mediaPath) formData.append('path', mediaPath);

  const res = await xhrUpload('/api/upload/vercel-blob', 'POST', formData, {}, onProgress);
  if (!res.ok) {
    throw new Error(res.json?.message || `Vercel Blob upload failed (${res.status})`);
  }
  return { url: res.json.url, filename: res.json.filename };
}

export function determineUploadMethod(options: UploadStrategyOptions): UploadMethod {
  const { file, mediaServerUrl } = options;
  const size = file.size;

  // If no media server URL, we can't use tunnel
  if (!mediaServerUrl) {
    return 'fallback';
  }

  // For large files (>100MB) where Vercel Blob is available, use Vercel Blob
  // Vercel Blob has much better upload speeds and handles large files well
  if (size > 100 * 1024 * 1024 && size <= 2 * 1024 * 1024 * 1024 && hasVercelBlobToken()) {
    return 'vercel-blob';
  }

  // For files larger than chunk size, use chunked upload through tunnel
  if (size > 50 * 1024 * 1024) {
    return 'tunnel-chunked';
  }

  // For smaller files, use direct upload through tunnel
  return 'tunnel-direct';
}

async function uploadViaTunnel(
  file: File,
  mediaServerUrl: string,
  mediaPath: string | undefined,
  onProgress?: (percent: number) => void
): Promise<{ url: string; filename: string }> {
  const { adminService } = await import('../services/adminService.js');
  return adminService.uploadFile(file, onProgress, mediaPath);
}

async function uploadDirect(
  file: File,
  mediaServerUrl: string,
  mediaPath: string | undefined,
  onProgress?: (percent: number) => void
): Promise<{ url: string; filename: string }> {
  const { adminService } = await import('../services/adminService.js');
  return adminService.uploadFile(file, onProgress, mediaPath);
}

export async function uploadFileWithStrategy(options: { file: File; mediaPath?: string; onProgress?: (percent: number) => void; mediaServerUrl?: string }): Promise<{
  url: string;
  filename: string;
  method: 'vercel-blob' | 'tunnel-chunked' | 'tunnel-direct' | 'fallback';
  vercelBlobUrl?: string;
}> {
  const { file, mediaPath, onProgress, mediaServerUrl } = options;
  const method = determineUploadMethod({ file, mediaServerUrl });

  console.log(`[UploadStrategy] file=${file.name} size=${file.size} method=${method} mediaServerUrl=${mediaServerUrl ? 'yes' : 'no'}`);

  try {
    let result: { url: string; filename: string };

    switch (method) {
      case 'vercel-blob': {
        const result = await uploadToVercelBlob(file, options.mediaPath, onProgress);
        return { ...result, method: 'vercel-blob', vercelBlobUrl: result.url };
      }

      case 'tunnel-chunked':
      case 'tunnel-direct': {
        if (!mediaServerUrl) throw new Error('Media server URL required for tunnel upload');
        const result = await uploadViaTunnel(file, mediaServerUrl, options.mediaPath, onProgress);
        return { ...result, method };
      }

      case 'fallback':
      default:
        throw new Error('No upload method available. Media server offline and Vercel Blob not configured.');
    }
  } catch (error: any) {
    // If Vercel Blob fails, try tunnel as fallback
    if (method === 'vercel-blob' && mediaServerUrl) {
      console.warn('[UploadStrategy] Vercel Blob upload failed, falling back to tunnel:', error.message);
      const result = await uploadViaTunnel(file, mediaServerUrl, options.mediaPath, onProgress);
      return { ...result, method: 'tunnel-chunked' };
    }
    throw error;
  }
}

export function getUploadMethodDescription(method: 'vercel-blob' | 'tunnel-chunked' | 'tunnel-direct' | 'fallback'): string {
  const descriptions: Record<string, string> = {
    'vercel-blob': 'Vercel Blob (Fast CDN Upload)',
    'tunnel-chunked': 'Chunked Upload via Tunnel (50MB chunks)',
    'tunnel-direct': 'Direct Upload via Tunnel',
    'fallback': 'Server Proxy (Dev Only)',
  };
  return descriptions[method] || method;
}