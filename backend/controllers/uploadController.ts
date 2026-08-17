import { Request, Response } from 'express';
import crypto from 'crypto';
import path from 'path';
import fs from 'fs';

const uploadsDir = path.join(process.cwd(), 'uploads');

export const handleFileUpload = (req: Request, res: Response) => {
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
    return res.status(500).json({ message: err.message || 'Failed to save uploaded file' });
  }
};