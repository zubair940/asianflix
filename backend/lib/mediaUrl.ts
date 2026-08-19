import fs from 'fs';
import path from 'path';

// The PC media server's public URL. Source of truth, in priority order:
//   1. media-config.json committed at the repo root (updated automatically
//      whenever the Cloudflare tunnel URL rotates — auto-deploys with git)
//   2. MEDIA_SERVER_URL env var (Vercel dashboard — manual)
// When the tunnel restarts it gets a NEW random URL, so any stored absolute
// URL with an old trycloudflare hostname must be rewritten at serve time.
let cachedBase: string | null = null;

function readConfigUrl(): string {
  try {
    const raw = fs.readFileSync(path.join(process.cwd(), 'media-config.json'), 'utf-8');
    const cfg = JSON.parse(raw) as { mediaServerUrl?: string };
    if (cfg.mediaServerUrl && cfg.mediaServerUrl.trim()) return cfg.mediaServerUrl.trim();
  } catch {
    // no media-config.json — fall through to env-only
  }
  return '';
}

export function mediaServerBaseUrl(): string {
  if (cachedBase !== null) return cachedBase;
  const configUrl = readConfigUrl();
  const envUrl = (process.env.MEDIA_SERVER_URL || '').trim();
  cachedBase = (configUrl || envUrl).replace(/\/+$/, '');
  return cachedBase;
}

// Resolves a stored media URL against the CURRENT media server base:
//   - absolute URL on any trycloudflare host -> re-prefixed with current base
//   - relative /uploads/... path                 -> prefixed with current base
//   - everything else (dicebear, unsplash, google samples, data:) untouched
export function resolveMediaUrl(url: string | undefined | null): string {
  if (!url) return '';
  const trimmed = url.trim();
  if (!trimmed) return '';
  if (trimmed.startsWith('/uploads/')) {
    const base = mediaServerBaseUrl();
    return base ? `${base}${trimmed}` : trimmed;
  }
  if (!trimmed.includes('://')) return trimmed;
  try {
    const u = new URL(trimmed);
    if (u.hostname.endsWith('trycloudflare.com')) {
      const base = mediaServerBaseUrl();
      // new URL('https://host') has pathname '/' — don't append it, or the
      // rewritten URL gains a spurious trailing slash.
      const pathname = u.pathname && u.pathname !== '/' ? u.pathname : '';
      return base ? `${base}${pathname}${u.search}` : trimmed;
    }
    return trimmed;
  } catch {
    return trimmed;
  }
}

// Deep-walks an API response body and rewrites every media URL string it
// finds (posters, backdrops, videoUrl, thumbnails, subtitle tracks, banners).
export function rewriteMediaUrls<T>(body: T): T {
  if (typeof body === 'string') {
    if (body.includes('trycloudflare.com') || body.startsWith('/uploads/')) {
      return resolveMediaUrl(body) as unknown as T;
    }
    return body;
  }
  if (Array.isArray(body)) {
    return body.map((item) => rewriteMediaUrls(item)) as unknown as T;
  }
  if (body && typeof body === 'object') {
    const out: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(body as Record<string, unknown>)) {
      out[key] = rewriteMediaUrls(value);
    }
    return out as unknown as T;
  }
  return body;
}