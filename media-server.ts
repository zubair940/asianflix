// AsianFlix local media server — run this on YOUR PC.
//
// ALL media (videos, posters, banners, subtitles) lives ONLY in MEDIA_DIR on
// this machine. No cloud storage is used. Expose it publicly with a free
// Cloudflare Tunnel, then set MEDIA_SERVER_URL in Vercel and the admin panel
// uploads directly to this server (browser -> tunnel -> your PC).
//
//   npm run media-server
//   cloudflared tunnel --url http://localhost:8787
//   -> copy the printed https://<random>.trycloudflare.com URL:
//      - into .env   as MEDIA_PUBLIC_URL (used in URLs this server returns)
//      - into Vercel as MEDIA_SERVER_URL (what the site talks to)
//
// Folder structure on disk (MEDIA_DIR, default D:\asianflix\uploads):
//   uploads/
//     dramas/<drama-id>/
//       poster.jpg, banner.jpg, ...
//       episodes/episode-<n>.mp4, thumb-<n>.jpg
//       subtitles/episode-<n>.vtt
//     temp/            (files waiting for a final folder)
//
// Uploads accept an optional multipart field "path":
//   - "temp"                              -> temp/<uuid>.<ext>
//   - "dramas/123"                        -> dramas/123/<uuid>.<ext>
//   - "dramas/123/poster.jpg" (explicit)  -> dramas/123/poster.jpg (overwrites)
//
// Env vars (all optional, defaults shown):
//   MEDIA_PORT           port to listen on                   (8787)
//   MEDIA_DIR            media folder                        (./uploads)
//   MEDIA_PUBLIC_URL     public base URL in responses        (http://localhost:PORT)
//   MEDIA_LOG            log file path                       (MEDIA_DIR/logs/media-server.log)
//   CORS_ORIGIN          allowed upload origins, comma-separated (any)
//
// Serving features: HTTP Range/206 (seekable video), ETag + Last-Modified
// (revalidation), server-logged uploads/errors. Large files (2GB+) stream
// straight to disk via multer diskStorage — never loaded into RAM.
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
const LOG_FILE = path.resolve(process.env.MEDIA_LOG || path.join(MEDIA_DIR, 'logs', 'media-server.log'));
const TEMP_DIR = path.join(MEDIA_DIR, 'temp');
const MAX_FILE_SIZE = 20 * 1024 * 1024 * 1024; // 20 GB per file (2GB+ supported)

const ALLOWED_EXT = /\.(jpe?g|png|webp|avif|gif|mp4|webm|mkv|mov|vtt|srt)$/i;
const MB = 1024 * 1024;

fs.mkdirSync(TEMP_DIR, { recursive: true });

const ts = () => new Date().toISOString();

function log(line: string) {
  const entry = `[${ts()}] ${line}`;
  console.log(entry);
  try {
    fs.mkdirSync(path.dirname(LOG_FILE), { recursive: true });
    fs.appendFileSync(LOG_FILE, entry + '\n');
  } catch {
    /* logging must never crash the server */
  }
}

// Strips anything that could escape the media dir (.., absolute paths, drive
// letters, colons, backslashes, spaces).
function safeSegment(segment: string): string {
  return segment.replace(/[^A-Za-z0-9._-]/g, '').slice(0, 120);
}

function sanitizeExt(name: string): string {
  const ext = path.extname(name || '').toLowerCase();
  return ext.replace(/[^a-z0-9.]/g, '');
}

// Resolve where a file should land based on the optional multipart "path"
// field. Explicit paths (last segment contains an extension) are used
// verbatim; otherwise a fresh UUID basename is generated.
function resolveTarget(file: Express.Multer.File, pathField?: string): string {
  const originalExt = sanitizeExt(file.originalname);

  if (!pathField) {
    return `dramas/${crypto.randomUUID()}${originalExt || '.mp4'}`;
  }

  const segments = pathField
    .split('/')
    .map((s) => s.trim())
    .filter(Boolean)
    .map(safeSegment);

  if (segments.length === 0) {
    return `dramas/${crypto.randomUUID()}${originalExt || '.mp4'}`;
  }

  const last = segments[segments.length - 1];
  const explicitName = last.includes('.');
  if (explicitName) {
    const nameExt = sanitizeExt(last);
    if (!ALLOWED_EXT.test(nameExt || '.')) {
      throw new Error(`Unsupported file type "${nameExt}". Allowed: jpeg, png, webp, avif, gif, mp4, webm, mkv, mov, vtt, srt`);
    }
    return segments.join('/');
  }

  return `${segments.join('/')}/${crypto.randomUUID()}${originalExt || '.mp4'}`;
}

const app = express();
app.use(
  cors({
    origin: CORS_ORIGIN === '*' ? true : CORS_ORIGIN.split(',').map((s) => s.trim()),
  })
);

// diskStorage streams the upload to a temp file — safe for very large videos.
const upload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, TEMP_DIR),
    filename: (_req, file, cb) => cb(null, `${crypto.randomUUID()}${sanitizeExt(file.originalname)}`),
  }),
  limits: { fileSize: MAX_FILE_SIZE },
});

// GET /health — sanity check, also reachable through the tunnel.
app.get('/health', (_req, res) => {
  res.json({
    ok: true,
    provider: 'local-media-server',
    port: PORT,
    dir: MEDIA_DIR,
    uptime: process.uptime(),
  });
});

// POST /api/upload — multipart field "file" (+ optional "path" folder hint).
app.post('/api/upload', upload.single('file'), (req, res) => {
  const start = Date.now();
  try {
    const file = req.file;
    if (!file) {
      return res.status(400).json({ message: 'No file uploaded (multipart field must be named "file")' });
    }

    const originalExt = sanitizeExt(file.originalname);
    if (!ALLOWED_EXT.test(originalExt || '.')) {
      fs.unlinkSync(file.path);
      return res.status(400).json({
        message: `Unsupported file type "${originalExt || '?'}". Allowed: jpeg, png, webp, avif, gif, mp4, webm, mkv, mov, vtt, srt`,
      });
    }

    const relative = resolveTarget(file, typeof req.body.path === 'string' ? req.body.path : undefined);
    const finalPath = path.join(MEDIA_DIR, relative);
    if (!finalPath.startsWith(MEDIA_DIR + path.sep)) {
      fs.unlinkSync(file.path);
      return res.status(400).json({ message: 'Invalid path' });
    }

    const replaced = fs.existsSync(finalPath);
    fs.mkdirSync(path.dirname(finalPath), { recursive: true });
    fs.renameSync(file.path, finalPath);

    const sizeMB = (file.size / MB).toFixed(2);
    const duration = Date.now() - start;
    log(`upload ${replaced ? 'REPLACED' : 'saved'} ${file.originalname} (${sizeMB} MB) -> ${relative} (${duration}ms)`);

    return res.status(201).json({
      message: 'File uploaded to local media server',
      provider: 'local-media-server',
      filename: path.basename(relative),
      originalName: file.originalname,
      mimetype: file.mimetype,
      size: file.size,
      url: `${PUBLIC_URL}/uploads/${relative.split('/').map(encodeURIComponent).join('/')}`,
      relativeUrl: `/uploads/${relative}`,
    });
  } catch (error: unknown) {
    const err = error as Error;
    if (req.file?.path) {
      try { fs.unlinkSync(req.file.path); } catch { /* already gone */ }
    }
    log(`upload FAILED: ${err.message}`);
    return res.status(500).json({ message: err.message || 'Failed to save file' });
  }
});

// Static media: Range/206 (seekable), ETag + Last-Modified (revalidation),
// 1h browser cache so a replaced file (same name) goes stale quickly.
app.use(
  '/uploads',
  express.static(MEDIA_DIR, {
    maxAge: '1h',
    etag: true,
    lastModified: true,
    setHeaders: (res) => {
      res.setHeader('Accept-Ranges', 'bytes');
    },
  })
);

// Central error handler — turns multer failures into clean JSON responses.
app.use((error: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  if (error instanceof multer.MulterError && error.code === 'LIMIT_FILE_SIZE') {
    log(`upload REJECTED (too large): >${MAX_FILE_SIZE / 1024 / 1024 / 1024}GB`);
    return res.status(413).json({ message: `File exceeds the ${MAX_FILE_SIZE / 1024 / 1024 / 1024}GB limit` });
  }
  const err = error as Error;
  log(`error: ${err.message}`);
  return res.status(500).json({ message: err.message || 'Internal server error' });
});

// 404 handler — unknown routes return a clean JSON body.
app.use((_req, res) => {
  res.status(404).json({ message: 'Not found' });
});

app.listen(PORT, () => {
  log(`AsianFlix local media server started`);
  log(`  Local:     http://localhost:${PORT}/health`);
  log(`  Uploads:   POST ${PUBLIC_URL}/api/upload (multipart "file", optional "path")`);
  log(`  Media dir: ${MEDIA_DIR}`);
  log(`  Log file:  ${LOG_FILE}`);
  log(`  Size cap:  ${MAX_FILE_SIZE / 1024 / 1024 / 1024}GB per file (2GB+ supported)`);
  log('To expose publicly (free, no credit card):');
  log(`  1. cloudflared tunnel --url http://localhost:${PORT}`);
  log(`  2. .env   -> MEDIA_PUBLIC_URL=https://<printed-tunnel-url>`);
  log(`  3. Vercel -> Settings -> Environment Variables: MEDIA_SERVER_URL=https://<printed-tunnel-url> (then redeploy)`);
});