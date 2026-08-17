import { Request, Response } from 'express';
import { list, del } from '@vercel/blob';
import { store } from '../config/store.js';

const MB = 1024 * 1024;

// Collects every media URL currently referenced by stored content. Blobs that
// are NOT in this set are safe to delete.
function collectReferencedUrls(): Set<string> {
  const urls = new Set<string>();
  const add = (url?: string) => {
    if (url) urls.add(url);
  };

  for (const drama of store.dramas) {
    add(drama.poster);
    add(drama.backdrop);
  }
  for (const ep of store.episodes) {
    add(ep.videoUrl);
    add(ep.thumbnail);
    for (const sub of ep.subtitles || []) add(sub.url);
    for (const server of ep.servers || []) add(server.url);
  }
  for (const banner of store.banners || []) add(banner.imageUrl);
  return urls;
}

// GET /api/admin/blob/list
// Lists all Vercel Blob objects with sizes, so you can see what is consuming
// the free 1GB store before cleaning up.
export const listBlobs = async (_req: Request, res: Response) => {
  try {
    const result = await list({ limit: 1000 });
    const blobs = result.blobs.map((b) => ({ url: b.url, pathname: b.pathname, size: b.size }));
    return res.json({
      total: blobs.length,
      totalBytes: blobs.reduce((sum, b) => sum + b.size, 0),
      blobs,
    });
  } catch (error: unknown) {
    const err = error as Error;
    return res.status(500).json({ message: err.message || 'Failed to list blobs' });
  }
};

// POST /api/admin/blob/cleanup
// Deletes every blob NOT referenced by any stored drama, episode, banner, or
// subtitle URL. Use this once media has moved to the local media server —
// it frees Vercel Blob storage without breaking anything in use.
export const cleanupUnusedBlobs = async (_req: Request, res: Response) => {
  try {
    const referenced = collectReferencedUrls();
    const result = await list({ limit: 1000 });
    const unused = result.blobs.filter((b) => !referenced.has(b.url) && !referenced.has(b.pathname));

    if (unused.length > 0) {
      await del(unused.map((b) => b.url));
    }

    const freedBytes = unused.reduce((sum, b) => sum + b.size, 0);
    return res.json({
      scanned: result.blobs.length,
      deleted: unused.length,
      freedBytes,
      freedMB: Math.round((freedBytes / MB) * 100) / 100,
      remainingBytes: result.blobs.reduce((sum, b) => sum + b.size, 0) - freedBytes,
    });
  } catch (error: unknown) {
    const err = error as Error;
    return res.status(500).json({ message: err.message || 'Failed to clean up blobs' });
  }
};
