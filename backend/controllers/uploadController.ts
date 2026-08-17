import { Request, Response } from 'express';
import { r2Storage, initializeR2FromEnv } from '../lib/r2.js';
import { storeFile, sanitizeKey, isBlobConfigured, getStorageStatus } from '../lib/storage.js';

initializeR2FromEnv();

const ALLOWED_TYPES: Record<string, string[]> = {
  image: ['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/gif'],
  video: ['video/mp4', 'video/webm', 'video/x-matroska', 'video/quicktime'],
  subtitle: ['text/vtt', 'application/x-subrip', 'text/plain'],
};

function isAllowedContentType(contentType: string): boolean {
  return Object.values(ALLOWED_TYPES).some(list => list.includes(contentType)) || contentType === 'application/octet-stream';
}

// POST /api/admin/upload/presigned-url
// Generates a presigned URL so the browser can upload DIRECTLY to Cloudflare R2.
export const generateUploadPresignUrl = async (req: Request, res: Response) => {
  try {
    const { fileName, fileType } = req.body;

    if (!fileName || !fileType) {
      return res.status(400).json({ message: 'fileName and fileType are required' });
    }

    if (!isAllowedContentType(fileType)) {
      return res.status(400).json({ message: `Unsupported file type: ${fileType}. Allowed: jpeg, png, webp, avif, gif, mp4, webm, mkv, mov, vtt, srt` });
    }

    if (!r2Storage.isInitialized()) {
      return res.status(503).json({
        message: 'Cloud storage (Cloudflare R2) is not configured. Set R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME env vars in Vercel, or use /admin/upload/client-token with Vercel Blob (free, no credit card).'
      });
    }

    const key = sanitizeKey(fileName);
    const result = await r2Storage.generatePresignedUploadUrl(key, fileType);

    return res.status(200).json({
      message: 'Presigned upload URL generated',
      uploadUrl: result.uploadUrl,
      key: result.key,
      expiresIn: result.expiresIn,
      publicUrl: r2Storage.getPublicUrl(key),
    });
  } catch (error: unknown) {
    const err = error as Error;
    return res.status(500).json({ message: err.message || 'Failed to generate upload URL' });
  }
};

// POST /api/admin/upload/client-token
// Returns a Vercel Blob client upload token so the browser can PUT files
// DIRECTLY to Blob storage (free on the Hobby plan, no credit card needed).
// Skipped when R2 is configured — presigned-url is preferred there.
export const generateClientUploadToken = async (req: Request, res: Response) => {
  try {
    const { fileName, fileType } = req.body;

    if (!fileName || !fileType) {
      return res.status(400).json({ message: 'fileName and fileType are required' });
    }

    if (!isAllowedContentType(fileType)) {
      return res.status(400).json({ message: `Unsupported file type: ${fileType}. Allowed: jpeg, png, webp, avif, gif, mp4, webm, mkv, mov, vtt, srt` });
    }

    if (r2Storage.isInitialized()) {
      return res.status(409).json({ message: 'R2 is configured — use /admin/upload/presigned-url instead.' });
    }

    if (!isBlobConfigured()) {
      return res.status(503).json({
        message: 'No free cloud storage configured. In Vercel: Storage -> Create Blob Store -> connect to this project (free on Hobby, no credit card). This adds the BLOB_READ_WRITE_TOKEN env var.'
      });
    }

    const key = sanitizeKey(fileName);
    const { getClientUploadToken } = await import('@vercel/blob');
    const result = await getClientUploadToken({ pathname: key, access: 'public' });

    return res.status(200).json({
      message: 'Blob upload token generated',
      uploadUrl: result.url,
      token: result.token,
      key,
      url: result.url,
    });
  } catch (error: unknown) {
    const err = error as Error;
    return res.status(500).json({ message: err.message || 'Failed to generate upload token' });
  }
};

// GET /api/admin/storage-status
// Reports which storage provider is currently active.
export const getStorageStatusHandler = (_req: Request, res: Response) => {
  return res.json(getStorageStatus());
};

// POST /api/upload/file (server proxy fallback)
// Pushes the file through the unified provider chain (R2 -> Vercel Blob ->
// local disk). Used for small files (images/subtitles) when the direct
// browser upload paths are unavailable.
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
      message: `File uploaded successfully (${stored.provider})`,
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
      message: err.message
        ? `${err.message} Configure Vercel Blob (BLOB_READ_WRITE_TOKEN, free, no credit card) or R2 env vars to enable uploads.`
        : 'Failed to save uploaded file'
    });
  }
};
