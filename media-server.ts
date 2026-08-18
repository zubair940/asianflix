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
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import multer from 'multer';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { pipeline } from 'node:stream/promises';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const PORT = Number(process.env.MEDIA_PORT || 8787);
const MEDIA_DIR = path.resolve(process.env.MEDIA_DIR || path.join(__dirname, 'uploads'));
const PUBLIC_URL = (process.env.MEDIA_PUBLIC_URL || `http://localhost:${PORT}`).replace(/\/+$/, '');
const CORS_ORIGIN = process.env.CORS_ORIGIN || '*';
const LOG_FILE = path.resolve(process.env.MEDIA_LOG || path.join(MEDIA_DIR, 'logs', 'media-server.log'));
const TEMP_DIR = path.join(MEDIA_DIR, 'temp');
const CHUNK_DIR = path.join(__dirname, '.chunks'); // outside MEDIA_DIR so parts are never publicly served
const MAX_FILE_SIZE = 20 * 1024 * 1024 * 1024; // 20 GB per file (2GB+ supported)
const CHUNK_MAX_SIZE = 100 * 1024 * 1024; // per-chunk cap — Cloudflare's free tunnel limit is ~100MB per request

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

// Explicit CORS with preflight handling — critical for browser uploads through Cloudflare Tunnel
app.use((req, res, next) => {
  const origin = req.headers.origin;
  const allowed = CORS_ORIGIN === '*' ? true : CORS_ORIGIN.split(',').map((s) => s.trim());
  
  // Always echo the origin for Cloudflare Tunnel compatibility
  const allowOrigin = (allowed === true || (Array.isArray(allowed) && origin && allowed.includes(origin))) 
    ? (origin || '*') 
    : '*';
  
  res.setHeader('Access-Control-Allow-Origin', allowOrigin);
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Range, Content-Range, Content-Length');
  res.setHeader('Access-Control-Expose-Headers', 'Content-Length, Content-Range, Accept-Ranges');
  res.setHeader('Access-Control-Max-Age', '86400');
  
  if (req.method === 'OPTIONS') {
    log(`CORS PREFLIGHT: origin=${origin}, allowed=${allowOrigin}`);
    return res.sendStatus(204);
  }
  next();
});

// Debug: Log all headers for upload requests
app.use('/api/upload', (req, res, next) => {
  log(`UPLOAD HEADERS: origin=${req.headers.origin}, content-type=${req.headers['content-type']}, content-length=${req.headers['content-length']}`);
  next();
});

// Request logger for debugging
app.use((req, _res, next) => {
  log(`REQUEST ${req.method} ${req.path} origin=${req.headers.origin || 'none'} ua=${req.headers['user-agent']?.slice(0, 50)}`);
  next();
});

// diskStorage streams the upload to a temp file — safe for very large videos.
const upload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, TEMP_DIR),
    filename: (_req, file, cb) => cb(null, `${crypto.randomUUID()}${sanitizeExt(file.originalname)}`),
  }),
  limits: { fileSize: MAX_FILE_SIZE },
});

// Chunked-upload storage — each chunk lands in .chunks/<uploadId>/<index>.part.
// Multipart fields (uploadId, index, total, path) MUST be appended BEFORE the
// file so multer sees them while the file part is being streamed.
const chunkUpload = multer({
  storage: multer.diskStorage({
    destination: (req, _file, cb) => {
      const uploadId = String((req.body as any)?.uploadId || 'upload').replace(/[^a-zA-Z0-9-]/g, '').slice(0, 64);
      const dir = path.join(CHUNK_DIR, uploadId);
      try {
        fs.mkdirSync(dir, { recursive: true });
        cb(null, dir);
      } catch (err) {
        cb(err as Error, dir);
      }
    },
    filename: (req, _file, cb) => {
      const index = Number((req.body as any)?.index);
      cb(null, `${String(Number.isFinite(index) ? index : 0).padStart(6, '0')}.part`);
    },
  }),
  limits: { fileSize: CHUNK_MAX_SIZE },
});

function sweepStaleChunks() {
  if (!fs.existsSync(CHUNK_DIR)) return;
  const cutoff = Date.now() - 3 * 60 * 60 * 1000;
  for (const entry of fs.readdirSync(CHUNK_DIR)) {
    const dir = path.join(CHUNK_DIR, entry);
    try {
      if (fs.statSync(dir).mtimeMs < cutoff) fs.rmSync(dir, { recursive: true, force: true });
    } catch {
      /* keep sweeping */
    }
  }
}
setInterval(sweepStaleChunks, 60 * 60 * 1000);

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

// POST /api/test-upload — simple JSON echo to test tunnel + CORS without multer
app.post('/api/test-upload', express.json({ limit: '10mb' }), (req, res) => {
  log(`TEST-UPLOAD: received ${JSON.stringify(req.body).slice(0, 200)}`);
  res.json({ ok: true, received: req.body, timestamp: Date.now() });
});

// POST /api/upload — multipart field "file" (+ optional "path" folder hint).
app.post('/api/upload', upload.single('file'), (req, res) => {
  const start = Date.now();
  log(`UPLOAD request: origin=${req.headers.origin}, content-length=${req.headers['content-length']}, path=${req.body.path || '(none)'}`);
  
  try {
    const file = req.file;
    if (!file) {
      log(`UPLOAD error: no file in request`);
      return res.status(400).json({ message: 'No file uploaded (multipart field must be named "file")' });
    }

    const originalExt = sanitizeExt(file.originalname);
    if (!ALLOWED_EXT.test(originalExt || '.')) {
      fs.unlinkSync(file.path);
      log(`UPLOAD error: unsupported type ${originalExt}`);
      return res.status(400).json({
        message: `Unsupported file type "${originalExt || '?'}". Allowed: jpeg, png, webp, avif, gif, mp4, webm, mkv, mov, vtt, srt`,
      });
    }

    const relative = resolveTarget(file, typeof req.body.path === 'string' ? req.body.path : undefined);
    const finalPath = path.join(MEDIA_DIR, relative);
    if (!finalPath.startsWith(MEDIA_DIR + path.sep)) {
      fs.unlinkSync(file.path);
      log(`UPLOAD error: invalid path ${relative}`);
      return res.status(400).json({ message: 'Invalid path' });
    }

    const replaced = fs.existsSync(finalPath);
    fs.mkdirSync(path.dirname(finalPath), { recursive: true });
    fs.renameSync(file.path, finalPath);

    const sizeMB = (file.size / MB).toFixed(2);
    const duration = Date.now() - start;
    log(`upload ${replaced ? 'REPLACED' : 'saved'} ${file.originalname} (${sizeMB} MB) -> ${relative} (${duration}ms)`);

    const fileUrl = `${PUBLIC_URL}/uploads/${relative.split('/').map(encodeURIComponent).join('/')}`;
    log(`UPLOAD success: ${fileUrl}`);
    
    return res.status(201).json({
      ok: true,
      message: 'File uploaded to local media server',
      provider: 'local-media-server',
      filename: path.basename(relative),
      originalName: file.originalname,
      mimetype: file.mimetype,
      size: file.size,
      url: fileUrl,
      relativeUrl: `/uploads/${relative}`,
    });
  } catch (error: unknown) {
    const err = error as Error;
    if (req.file?.path) {
      try { fs.unlinkSync(req.file.path); } catch { /* already gone */ }
    }
    log(`UPLOAD FAILED: ${err.message}`);
    return res.status(500).json({ message: err.message || 'Failed to save file' });
  }
});

// Static media: Range/206 (seekable), ETag + Last-Modified (revalidation).
// UUID-named files never change -> immutable 1-year cache. Explicitly named
// files (episode-1.mp4 etc.) CAN be replaced -> short cache + revalidation.
app.use(
  '/uploads',
  express.static(MEDIA_DIR, {
    maxAge: '1h',
    etag: true,
    lastModified: true,
    setHeaders: (res, filePath) => {
      res.setHeader('Accept-Ranges', 'bytes');
      const base = path.basename(filePath);
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\./i.test(base);
      res.setHeader(
        'Cache-Control',
        isUuid ? 'public, max-age=31536000, immutable' : 'public, max-age=3600, must-revalidate'
      );
    },
  })
);

// --- Chunked upload endpoints (large videos that exceed Cloudflare's free
// tunnel per-request body cap). The browser slices the file into <=100MB
// parts, uploads them one at a time, then calls /api/upload/complete which
// concatenates them in order into the final file.

// POST /api/upload/chunk — multipart fields BEFORE "file":
//   uploadId: client-generated uuid for this upload session
//   index:    0-based chunk number
//   total:    total chunk count (informational)
//   path:     optional final destination hint (same rules as /api/upload)
app.post('/api/upload/chunk', chunkUpload.single('file'), (req, res) => {
  const file = req.file;
  const uploadId = String(req.body.uploadId || 'upload').replace(/[^a-zA-Z0-9-]/g, '').slice(0, 64);
  const index = Number(req.body.index);
  log(`CHUNK uploadId=${uploadId} index=${index} size=${file ? file.size : 0} total=${req.body.total || 1}`);

  if (!file) {
    return res.status(400).json({ ok: false, message: 'No chunk received (multipart field must be named "file")' });
  }

  // multer.diskStorage already placed the chunk at .chunks/<uploadId>/<index>.part
  const padded = `${String(Number.isFinite(index) ? index : 0).padStart(6, '0')}.part`;
  const stored = path.join(CHUNK_DIR, uploadId, padded);
  if (!fs.existsSync(stored)) {
    log(`CHUNK error: chunk not stored at ${stored}`);
    return res.status(500).json({ ok: false, message: 'Failed to store chunk' });
  }
  return res.status(201).json({ ok: true, uploadId, index: Number.isFinite(index) ? index : 0 });
});

// GET /api/upload/chunks/:uploadId — which indexes are already on disk.
// Lets a failed upload resume from where it stopped instead of restarting.
app.get('/api/upload/chunks/:uploadId', (req, res) => {
  const uploadId = String(req.params.uploadId || '').replace(/[^a-zA-Z0-9-]/g, '').slice(0, 64);
  const dir = path.join(CHUNK_DIR, uploadId);
  const indexes = fs.existsSync(dir)
    ? fs
        .readdirSync(dir)
        .filter((f) => f.endsWith('.part'))
        .map((f) => parseInt(f, 10))
        .filter((n) => Number.isFinite(n))
    : [];
  return res.json({ ok: true, uploadId, indexes });
});

// POST /api/upload/complete — JSON body { uploadId, filename, path? }.
// Concatenates all received chunks in index order into the final file.
app.post('/api/upload/complete', express.json({ limit: '1mb' }), async (req, res) => {
  const uploadId = String(req.body.uploadId || '').replace(/[^a-zA-Z0-9-]/g, '').slice(0, 64);
  const filename = String(req.body.filename || 'video.mp4');
  const targetHint = typeof req.body.path === 'string' ? req.body.path : undefined;
  const dir = path.join(CHUNK_DIR, uploadId);

  if (!uploadId || !fs.existsSync(dir)) {
    return res.status(404).json({ ok: false, message: 'No chunks found for this uploadId' });
  }

  const parts = fs.readdirSync(dir).filter((f) => f.endsWith('.part')).sort();
  if (parts.length === 0) {
    fs.rmSync(dir, { recursive: true, force: true });
    return res.status(404).json({ ok: false, message: 'No chunks found for this uploadId' });
  }

  try {
    const ext = sanitizeExt(filename);
    if (!ALLOWED_EXT.test(ext || '.')) {
      fs.rmSync(dir, { recursive: true, force: true });
      return res.status(400).json({
        ok: false,
        message: `Unsupported file type "${ext || '?'}". Allowed: jpeg, png, webp, avif, gif, mp4, webm, mkv, mov, vtt, srt`,
      });
    }

    const relative = resolveTarget({ originalname: filename } as Express.Multer.File, targetHint);
    const finalPath = path.join(MEDIA_DIR, relative);
    if (!finalPath.startsWith(MEDIA_DIR + path.sep)) {
      fs.rmSync(dir, { recursive: true, force: true });
      return res.status(400).json({ ok: false, message: 'Invalid path' });
    }

    fs.mkdirSync(path.dirname(finalPath), { recursive: true });
    const start = Date.now();
    // True move: rename the first part into place (no byte copy), then append
    // the remaining parts via streams. At no point do two full copies exist.
    const firstPart = path.join(dir, parts[0]);
    fs.renameSync(firstPart, finalPath);
    for (const part of parts.slice(1)) {
      await pipeline(fs.createReadStream(path.join(dir, part)), fs.createWriteStream(finalPath, { flags: 'a' }));
    }
    fs.rmSync(dir, { recursive: true, force: true });

    const size = fs.statSync(finalPath).size;
    const sizeMB = (size / MB).toFixed(2);
    const fileUrl = `${PUBLIC_URL}/uploads/${relative.split('/').map(encodeURIComponent).join('/')}`;
    log(`CHUNK assemble complete: ${parts.length} parts (${sizeMB} MB) -> ${relative} (${Date.now() - start}ms)`);

    return res.status(201).json({
      ok: true,
      message: 'File uploaded to local media server',
      provider: 'local-media-server',
      filename: path.basename(relative),
      originalName: filename,
      size,
      url: fileUrl,
      relativeUrl: `/uploads/${relative}`,
    });
  } catch (error: unknown) {
    const err = error as Error;
    fs.rmSync(dir, { recursive: true, force: true });
    log(`CHUNK complete FAILED: ${err.message}`);
    return res.status(500).json({ ok: false, message: err.message || 'Failed to assemble file' });
  }
});

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
  log(`  Chunked:   POST /api/upload/chunk + POST /api/upload/complete (large videos, auto-used by the admin panel)`);
  log(`  Media dir: ${MEDIA_DIR}`);
  log(`  Log file:  ${LOG_FILE}`);
  log(`  Size cap:  ${MAX_FILE_SIZE / 1024 / 1024 / 1024}GB per file (2GB+ supported)`);
  log('To expose publicly (free, no credit card):');
  log(`  1. cloudflared tunnel --url http://localhost:${PORT}`);
  log(`  2. .env   -> MEDIA_PUBLIC_URL=https://<printed-tunnel-url>`);
  log(`  3. Vercel -> Settings -> Environment Variables: MEDIA_SERVER_URL=https://<printed-tunnel-url> (then redeploy)`);
});