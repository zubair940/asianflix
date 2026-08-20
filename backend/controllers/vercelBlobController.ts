import { Request, Response } from 'express';
import { put, del, head } from '@vercel/blob';

export const uploadToVercelBlob = async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const token = process.env.BLOB_READ_WRITE_TOKEN;
    if (!token) {
      return res.status(503).json({ message: 'Vercel Blob not configured. Set BLOB_READ_WRITE_TOKEN in environment.' });
    }

    const file = req.file;
    const mediaPath = typeof req.body.path === 'string' ? req.body.path : undefined;

    const timestamp = Date.now();
    const randomSuffix = Math.random().toString(36).slice(2, 10);
    const ext = file.originalname.split('.').pop() || 'bin';
    const path = mediaPath ? `${mediaPath}/${timestamp}-${randomSuffix}.${ext}` : `uploads/${timestamp}-${randomSuffix}.${ext}`;

    const blob = await put(path, file.buffer, {
      access: 'public',
      token,
    });

    return res.status(201).json({
      message: 'File uploaded to Vercel Blob',
      filename: path.split('/').pop() || file.originalname,
      url: blob.url,
      pathname: blob.pathname,
      size: file.size,
      contentType: file.mimetype,
    });
  } catch (error: unknown) {
    const err = error as Error;
    console.error('Vercel Blob upload error:', err);
    return res.status(500).json({ message: err.message || 'Failed to upload to Vercel Blob' });
  }
};

export const deleteFromVercelBlob = async (req: Request, res: Response) => {
  try {
    const token = process.env.BLOB_READ_WRITE_TOKEN;
    if (!token) {
      return res.status(503).json({ message: 'Vercel Blob not configured' });
    }

    const { url } = req.body;
    if (!url) {
      return res.status(400).json({ message: 'URL is required' });
    }

    await del(url, { token });
    return res.json({ message: 'File deleted from Vercel Blob' });
  } catch (error: unknown) {
    const err = error as Error;
    console.error('Vercel Blob delete error:', err);
    return res.status(500).json({ message: err.message || 'Failed to delete from Vercel Blob' });
  }
};

export const getVercelBlobInfo = async (req: Request, res: Response) => {
  try {
    const token = process.env.BLOB_READ_WRITE_TOKEN;
    if (!token) {
      return res.status(503).json({ message: 'Vercel Blob not configured' });
    }

    const { url } = req.query;
    if (!url || typeof url !== 'string') {
      return res.status(400).json({ message: 'URL query parameter required' });
    }

    const blob = await head(url, { token });
    return res.json({
      url: blob.url,
      pathname: blob.pathname,
      size: blob.size,
      uploadedAt: blob.uploadedAt,
      contentType: blob.contentType,
    });
  } catch (error: unknown) {
    const err = error as Error;
    console.error('Vercel Blob head error:', err);
    return res.status(500).json({ message: err.message || 'Failed to get blob info' });
  }
};