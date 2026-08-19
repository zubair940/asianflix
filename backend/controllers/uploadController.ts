import { Request, Response } from 'express';
import { storeFile, getStorageStatus } from '../lib/storage.js';
import { mediaServerBaseUrl } from '../lib/mediaUrl.js';

// GET /api/dramas/media-config
// Tells the browser where the local media server lives (MEDIA_SERVER_URL on
// Vercel, falling back to the committed media-config.json). When set, uploads
// go DIRECTLY from the browser to your PC — no cloud storage is used.
export const getMediaServerConfigHandler = (_req: Request, res: Response) => {
  const url = mediaServerBaseUrl();
  return res.json({ mediaServerUrl: url || null });
};

// GET /api/admin/storage-status
// Reports which storage is currently active.
export const getStorageStatusHandler = (_req: Request, res: Response) => {
  return res.json(getStorageStatus());
};

// POST /api/upload/file (server proxy fallback)
// Used ONLY when the local media server is unreachable. Writes small files
// (images/subtitles) to the local disk. Videos must never be proxied through
// the serverless function (4.5MB request body limit -> 413).
export const handleFileUpload = async (req: Request, res: Response) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No file uploaded' });
  }

  try {
    const stored = await storeFile(req.file.originalname, req.file.mimetype, req.file.buffer);

    const host = req.get('host') || 'localhost:3000';
    const protocol = req.protocol || 'http';
    const url = stored.url.startsWith('/') ? `${protocol}://${host}${stored.url}` : stored.url;

    return res.status(201).json({
      message: 'File uploaded to local disk (media server offline — this is a development fallback)',
      filename: stored.key,
      originalName: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size,
      provider: stored.provider,
      url,
      relativeUrl: stored.url
    });
  } catch (error: unknown) {
    const err = error as Error;
    return res.status(503).json({
      message: err.message || 'Failed to save uploaded file'
    });
  }
};