// AsianFlix local media server — run this on YOUR PC.
//
// Serves all media (videos, posters, subtitles) from this machine so NEW
// uploads never touch Vercel Blob. Expose it publicly with a free Cloudflare
// Tunnel (no credit card), then set MEDIA_SERVER_URL in Vercel and the admin
// upload flow sends files straight from the browser to this server.
//
//   npm run media-server
//   cloudflared tunnel --url http://localhost:8787
//   -> copy the printed https://<random>.trycloudflare.com URL:
//      - into .env  as MEDIA_PUBLIC_URL (this server's responses)
//      - into Vercel as MEDIA_SERVER_URL (the site reads it from here)
//
// Env vars (all optional, defaults in parentheses):
//   MEDIA_PORT        port to listen on                (8787)
//   MEDIA_DIR         folder that holds the media files (./uploads)
//   MEDIA_PUBLIC_URL  public base URL used in responses (http://localhost:PORT)
//   CORS_ORIGIN       site origin allowed to upload, comma-separated (any)
//
// Range/206 requests are handled automatically by express.static, so seeking
// in the player works and doesn't re-download the whole file.
import express from 'express';
import cors from 'cors';
import multer from 'multer';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const PORT = Number(process.env.MEDIA_PORT || 8787);
const MEDIA_DIR = path.resolve(process.env.MEDIA_DIR || path.join(__dirname, 'uploads'));
const PUBLIC_URL = (process.env.MEDIA_PUBLIC_URL || `http://localhost:${PORT}`).replace(/\/+$/, '');
const CORS_ORIGIN = process.env.CORS_ORIGIN || '*';
const MAX_FILE_SIZE = 10 * 1024 * 1024 * 1024; // 10 GB per file

const ALLOWED_EXT = /\.(jpe?g|png|webp|avif|gif|mp4|webm|mkv|mov|vtt|srt)$/i;
const MB = 1024 * 1024;

fs.mkdirSync(MEDIA_DIR, { recursive: true });

const app = express();
app.use(
  cors({
    origin: CORS_ORIGIN === '*' ? true : CORS_ORIGIN.split(',').map((s) => s.trim()),
  })
);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_SIZE },
});

// GET /health — sanity check, also reachable through the tunnel.
app.get('/health', (_req, res) => {
  res.json({ ok: true, provider: 'local-media-server', port: PORT, dir: MEDIA_DIR });
});

// POST /api/upload — the site's admin upload flow posts files here directly
// from the browser (multipart field name: "file"). Files are saved with a
// random UUID name and the public URL is returned.
app.post('/api/upload', upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded (multipart field must be named "file")' });
    }

    const original = path.basename(req.file.originalname || 'upload');
    const ext = path.extname(original).toLowerCase();
    if (!ALLOWED_EXT.test(ext)) {
      return res.status(400).json({
        message: `Unsupported file type "${ext || '?'}". Allowed: jpeg, png, webp, avif, gif, mp4, webm, mkv, mov, vtt, srt`,
      });
    }

    const key = `${crypto.randomUUID()}${ext}`;
    const filePath = path.join(MEDIA_DIR, key);
    fs.writeFileSync(filePath, req.file.buffer);
    const sizeMB = (req.file.size / MB).toFixed(2);

    console.log(`[upload] ${original} (${sizeMB} MB) -> ${filePath}`);
    return res.status(201).json({
      message: 'File uploaded to local media server',
      provider: 'local-media-server',
      filename: key,
      originalName: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size,
      url: `${PUBLIC_URL}/uploads/${key}`,
      relativeUrl: `/uploads/${key}`,
    });
  } catch (error: unknown) {
    const err = error as Error;
    console.error('[upload] failed:', err.message);
    return res.status(500).json({ message: err.message || 'Failed to save file' });
  }
});

// Static media with Range support (seeking works; express.static handles
// Range/206 automatically).
app.use(
  '/uploads',
  express.static(MEDIA_DIR, {
    setHeaders: (res) => {
      res.setHeader('Accept-Ranges', 'bytes');
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    },
  })
);

app.listen(PORT, () => {
  console.log('AsianFlix local media server');
  console.log(`  Local:     http://localhost:${PORT}/health`);
  console.log(`  Files:     http://localhost:${PORT}/uploads/<file>`);
  console.log(`  Uploads:   POST ${PUBLIC_URL}/api/upload (multipart "file")`);
  console.log(`  Media dir: ${MEDIA_DIR}`);
  console.log('');
  console.log('To expose publicly (free, no credit card):');
  console.log(`  1. cloudflared tunnel --url http://localhost:${PORT}`);
  console.log('  2. copy the printed https://<random>.trycloudflare.com URL');
  console.log('  3. .env   -> MEDIA_PUBLIC_URL=https://<that URL>');
  console.log('  4. Vercel -> Settings -> Environment Variables: MEDIA_SERVER_URL=https://<that URL>');
  console.log('     (then redeploy)');
});
