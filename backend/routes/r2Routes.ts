import { Router } from 'express';
import { AuthRequest } from '../middleware/auth.js';
import { adminMiddleware } from '../middleware/admin.js';
import { r2Storage, generateDramaVideoKey, generateDramaPosterKey, generateDramaBackdropKey, generateEpisodeThumbnailKey, generateSubtitleKey } from '../../src/lib/r2.js';
import { store } from '../config/store.js';

const router = Router();

// All routes require admin authentication
router.use((req, res, next) => {
  // Check auth first
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Authentication token required' });
  }
  next();
}, adminMiddleware);

// Generate presigned upload URL for drama video
router.post('/presign/video', async (req: AuthRequest, res) => {
  try {
    const { dramaId, episodeNumber, fileName, contentType } = req.body;

    if (!dramaId || !episodeNumber || !fileName || !contentType) {
      return res.status(400).json({ message: 'dramaId, episodeNumber, fileName, and contentType are required' });
    }

    // Verify drama exists
    const drama = store.dramas.find(d => d.id === dramaId);
    if (!drama) {
      return res.status(404).json({ message: 'Drama not found' });
    }

    // Validate video content type
    const allowedVideoTypes = ['video/mp4', 'video/webm', 'video/x-matroska', 'video/quicktime'];
    if (!allowedVideoTypes.includes(contentType)) {
      return res.status(400).json({ message: 'Invalid video format. Allowed: mp4, webm, mkv, mov' });
    }

    const key = generateDramaVideoKey(dramaId, episodeNumber, fileName);
    const result = await r2Storage.generatePresignedUploadUrl(key, contentType);

    return res.json({
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
});

// Generate presigned upload URL for drama poster
router.post('/presign/poster', async (req: AuthRequest, res) => {
  try {
    const { dramaId, fileName, contentType } = req.body;

    if (!dramaId || !fileName || !contentType) {
      return res.status(400).json({ message: 'dramaId, fileName, and contentType are required' });
    }

    const drama = store.dramas.find(d => d.id === dramaId);
    if (!drama) {
      return res.status(404).json({ message: 'Drama not found' });
    }

    const allowedImageTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/avif'];
    if (!allowedImageTypes.includes(contentType)) {
      return res.status(400).json({ message: 'Invalid image format. Allowed: jpeg, png, webp, avif' });
    }

    const key = generateDramaPosterKey(dramaId, fileName);
    const result = await r2Storage.generatePresignedUploadUrl(key, contentType);

    return res.json({
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
});

// Generate presigned upload URL for drama backdrop
router.post('/presign/backdrop', async (req: AuthRequest, res) => {
  try {
    const { dramaId, fileName, contentType } = req.body;

    if (!dramaId || !fileName || !contentType) {
      return res.status(400).json({ message: 'dramaId, fileName, and contentType are required' });
    }

    const drama = store.dramas.find(d => d.id === dramaId);
    if (!drama) {
      return res.status(404).json({ message: 'Drama not found' });
    }

    const allowedImageTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/avif'];
    if (!allowedImageTypes.includes(contentType)) {
      return res.status(400).json({ message: 'Invalid image format. Allowed: jpeg, png, webp, avif' });
    }

    const key = generateDramaBackdropKey(dramaId, fileName);
    const result = await r2Storage.generatePresignedUploadUrl(key, contentType);

    return res.json({
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
});

// Generate presigned upload URL for episode thumbnail
router.post('/presign/thumbnail', async (req: AuthRequest, res) => {
  try {
    const { dramaId, episodeNumber, fileName, contentType } = req.body;

    if (!dramaId || !episodeNumber || !fileName || !contentType) {
      return res.status(400).json({ message: 'dramaId, episodeNumber, fileName, and contentType are required' });
    }

    const drama = store.dramas.find(d => d.id === dramaId);
    if (!drama) {
      return res.status(404).json({ message: 'Drama not found' });
    }

    const allowedImageTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/avif'];
    if (!allowedImageTypes.includes(contentType)) {
      return res.status(400).json({ message: 'Invalid image format. Allowed: jpeg, png, webp, avif' });
    }

    const key = generateEpisodeThumbnailKey(dramaId, episodeNumber, fileName);
    const result = await r2Storage.generatePresignedUploadUrl(key, contentType);

    return res.json({
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
});

// Generate presigned upload URL for subtitles
router.post('/presign/subtitle', async (req: AuthRequest, res) => {
  try {
    const { dramaId, episodeNumber, language, fileName, contentType } = req.body;

    if (!dramaId || !episodeNumber || !language || !fileName || !contentType) {
      return res.status(400).json({ message: 'dramaId, episodeNumber, language, fileName, and contentType are required' });
    }

    const drama = store.dramas.find(d => d.id === dramaId);
    if (!drama) {
      return res.status(404).json({ message: 'Drama not found' });
    }

    const allowedSubtitleTypes = ['text/vtt', 'text/plain', 'application/x-subrip'];
    if (!allowedSubtitleTypes.includes(contentType)) {
      return res.status(400).json({ message: 'Invalid subtitle format. Allowed: vtt, srt' });
    }

    const key = generateSubtitleKey(dramaId, episodeNumber, language, fileName);
    const result = await r2Storage.generatePresignedUploadUrl(key, contentType);

    return res.json({
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
});

// Generate signed streaming URL for video playback
router.post('/sign/stream', async (req: AuthRequest, res) => {
  try {
    const { key, expiresIn = 7200 } = req.body;

    if (!key) {
      return res.status(400).json({ message: 'Video key is required' });
    }

    // Verify file exists in R2
    const exists = await r2Storage.fileExists(key);
    if (!exists) {
      return res.status(404).json({ message: 'Video file not found' });
    }

    const streamUrl = await r2Storage.generateStreamingUrl(key, expiresIn);

    return res.json({
      streamUrl,
      expiresIn,
      key,
    });
  } catch (error: unknown) {
    const err = error as Error;
    return res.status(500).json({ message: err.message || 'Failed to generate streaming URL' });
  }
});

// Delete file from R2
router.delete('/file', async (req: AuthRequest, res) => {
  try {
    const { key } = req.body;

    if (!key) {
      return res.status(400).json({ message: 'File key is required' });
    }

    await r2Storage.deleteFile(key);

    return res.json({ message: 'File deleted successfully' });
  } catch (error: unknown) {
    const err = error as Error;
    return res.status(500).json({ message: err.message || 'Failed to delete file' });
  }
});

// Get file info
router.get('/file/info', async (req: AuthRequest, res) => {
  try {
    const { key } = req.query;

    if (!key || typeof key !== 'string') {
      return res.status(400).json({ message: 'File key is required' });
    }

    const exists = await r2Storage.fileExists(key);
    if (!exists) {
      return res.status(404).json({ message: 'File not found' });
    }

    return res.json({ exists: true, key, publicUrl: r2Storage.getPublicUrl(key) });
  } catch (error: unknown) {
    const err = error as Error;
    return res.status(500).json({ message: err.message || 'Failed to get file info' });
  }
});

export default router;