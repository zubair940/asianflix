import { Request, Response } from 'express';
import crypto from 'crypto';
import path from 'path';
import fs from 'fs';
import { r2Storage, initializeR2FromEnv } from '../lib/r2.js';

initializeR2FromEnv();

const uploadsDir = path.join(process.cwd(), 'uploads');

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
// No server-side file handling involved.
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
        message: 'Cloud storage (Cloudflare R2) is not configured. Set R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME env vars in Vercel, or use the server proxy for local development.'
      });
    }

    // Sanitize: only use the file extension, never the raw client filename
    const clean = path.basename(fileName);
    const ext = path.extname(clean).toLowerCase().replace(/[^a-z0-9.]/g, '');
    const key = `dramas/${crypto.randomUUID()}${ext || '.mp4'}`;

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

// POST /api/upload/file (server proxy — local development fallback)
// On serverless (Vercel) the disk is read-only, so if R2 is configured the
// file is uploaded to R2 instead; otherwise a clear error is returned.
export const handleFileUpload = async (req: Request, res: Response) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No file uploaded' });
  }

  try {
    fs.mkdirSync(uploadsDir, { recursive: true });

    const ext = path.extname(req.file.originalname);
    const filename = `${crypto.randomUUID()}${ext}`;
    const diskPath = path.join(uploadsDir, filename);

    fs.writeFileSync(diskPath, req.file.buffer);

    const host = req.get('host') || 'localhost:3000';
    const protocol = req.protocol || 'http';
    const relativeUrl = `/uploads/${filename}`;
    const fullUrl = `${protocol}://${host}${relativeUrl}`;

    return res.status(201).json({
      message: 'File uploaded successfully',
      filename,
      originalName: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size,
      url: fullUrl,
      relativeUrl
    });
  } catch (error: unknown) {
    const err = error as Error;
    const isFsError = err.message?.includes('ENOENT') || err.message?.includes('EACCES') || err.message?.includes('EPERM') || err.message?.includes('read-only');

    // Serverless environments (Vercel) have a read-only filesystem.
    // Fall back to uploading directly to R2 if it is configured.
    if (isFsError && r2Storage.isInitialized()) {
      try {
        const ext = path.extname(req.file.originalname);
        const key = `dramas/${crypto.randomUUID()}${ext || '.mp4'}`;
        const result = await r2Storage.uploadFile(key, req.file.buffer, req.file.mimetype || 'application/octet-stream');
        return res.status(201).json({
          message: 'File uploaded successfully (cloud storage)',
          filename: result.key,
          originalName: req.file.originalname,
          mimetype: req.file.mimetype,
          size: req.file.size,
          url: result.url,
          relativeUrl: result.url
        });
      } catch (r2Err) {
        return res.status(500).json({
          message: `Local file storage is not available (${err.message}) and cloud upload failed: ${(r2Err as Error).message}. Configure R2 env vars in Vercel to enable uploads.`
        });
      }
    }

    return res.status(500).json({
      message: isFsError
        ? `Server file storage is not available on this platform (${err.message}). Configure Cloudflare R2 env vars (R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME) to enable cloud uploads.`
        : (err.message || 'Failed to save uploaded file')
    });
  }
};