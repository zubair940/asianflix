import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

// Local-only media storage. ALL media (videos, posters, banners, subtitles)
// is stored ONLY on the local machine's media server (see media-server.ts).
// This module is the last-resort server proxy used when the media server is
// unreachable: small files (images/subtitles) are written to the local disk
// (development only — Vercel's filesystem is read-only/ephemeral).

export type StorageProvider = 'disk';

export interface StoredFile {
  key: string;
  url: string;
  provider: StorageProvider;
}

export const uploadsDir = path.join(process.cwd(), 'uploads');

// Build a sanitized storage key: only the extension is taken from the client
// filename; the name is always a fresh UUID.
export function sanitizeKey(fileName: string, fallbackExt = '.mp4'): string {
  const clean = path.basename(fileName || '');
  const ext = path.extname(clean).toLowerCase().replace(/[^a-z0-9.]/g, '');
  return `dramas/${crypto.randomUUID()}${ext || fallbackExt}`;
}

export async function storeFile(fileName: string, contentType: string, buffer: Buffer): Promise<StoredFile> {
  const key = sanitizeKey(fileName);
  fs.mkdirSync(uploadsDir, { recursive: true });
  fs.writeFileSync(path.join(uploadsDir, path.basename(key)), buffer);
  return { key, url: `/uploads/${path.basename(key)}`, provider: 'disk' };
}

export function getStorageStatus(): {
  diskWritable: boolean;
  mediaServerConfigured: boolean;
  activeProvider: string | null;
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

  const mediaServerConfigured = !!process.env.MEDIA_SERVER_URL;
  const activeProvider: string | null = mediaServerConfigured ? 'local-media-server' : diskWritable ? 'disk' : null;

  return { diskWritable, mediaServerConfigured, activeProvider };
}