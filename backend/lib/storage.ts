import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { r2Storage } from './r2.js';

// Unified media storage for ALL uploads (videos, posters, banners, thumbnails,
// subtitles). Provider chain, first configured wins:
//   1. Cloudflare R2  (if R2_* / CLOUDFLARE_* env vars set)
//   2. Vercel Blob    (if BLOB_READ_WRITE_TOKEN set — free on Hobby, no card)
//   3. Local disk     (uploads/ — development only; Vercel FS is read-only)
// Every provider stores under the same key prefix, so videos and images always
// live in the exact same location.

export type StorageProvider = 'r2' | 'blob' | 'disk';

export interface StoredFile {
  key: string;
  url: string;
  provider: StorageProvider;
}

export const uploadsDir = path.join(process.cwd(), 'uploads');

export function isBlobConfigured(): boolean {
  return !!process.env.BLOB_READ_WRITE_TOKEN;
}

// Build a sanitized storage key: only the extension is taken from the client
// filename; the name is always a fresh UUID.
export function sanitizeKey(fileName: string, fallbackExt = '.mp4'): string {
  const clean = path.basename(fileName || '');
  const ext = path.extname(clean).toLowerCase().replace(/[^a-z0-9.]/g, '');
  return `dramas/${crypto.randomUUID()}${ext || fallbackExt}`;
}

export async function storeFile(fileName: string, contentType: string, buffer: Buffer): Promise<StoredFile> {
  const key = sanitizeKey(fileName);

  if (r2Storage.isInitialized()) {
    await r2Storage.uploadFile(key, buffer, contentType || 'application/octet-stream');
    return { key, url: r2Storage.getPublicUrl(key), provider: 'r2' };
  }

  if (isBlobConfigured()) {
    const { put } = await import('@vercel/blob');
    const blob = await put(key, buffer, { access: 'public', contentType: contentType || 'application/octet-stream' });
    return { key: blob.pathname, url: blob.url, provider: 'blob' };
  }

  // Local disk (development only — serverless filesystems are read-only).
  fs.mkdirSync(uploadsDir, { recursive: true });
  fs.writeFileSync(path.join(uploadsDir, path.basename(key)), buffer);
  return { key, url: `/uploads/${path.basename(key)}`, provider: 'disk' };
}

export function getStorageStatus(): {
  r2Configured: boolean;
  blobConfigured: boolean;
  diskWritable: boolean;
  activeProvider: StorageProvider | null;
} {
  let diskWritable = false;
  try {
    fs.mkdirSync(uploadsDir, { recursive: true });
    const probe = path.join(uploadsDir, `.probe-${Date.now()}`);
    fs.writeFileSync(probe, 'ok');
    fs.unlinkSync(probe);
    diskWritable = true;
  } catch {
    diskWritable = false;
  }

  const r2 = r2Storage.isInitialized();
  const blob = isBlobConfigured();
  const activeProvider: StorageProvider | null = r2 ? 'r2' : blob ? 'blob' : diskWritable ? 'disk' : null;

  return { r2Configured: r2, blobConfigured: blob, diskWritable, activeProvider };
}
