import { Request, Response } from 'express';

export const handleFileUpload = (req: Request, res: Response) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No file uploaded' });
  }

  const host = req.get('host') || 'localhost:3000';
  const protocol = req.protocol || 'http';
  const relativeUrl = `/uploads/${req.file.filename}`;
  const fullUrl = `${protocol}://${host}${relativeUrl}`;

  return res.status(201).json({
    message: 'File uploaded successfully',
    filename: req.file.filename,
    originalName: req.file.originalname,
    mimetype: req.file.mimetype,
    size: req.file.size,
    url: fullUrl,
    relativeUrl
  });
};
