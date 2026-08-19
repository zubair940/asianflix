import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';

import authRoutes from '../backend/routes/authRoutes.js';
import dramaRoutes from '../backend/routes/dramaRoutes.js';
import episodeRoutes from '../backend/routes/episodeRoutes.js';
import userRoutes from '../backend/routes/userRoutes.js';
import adminRoutes from '../backend/routes/adminRoutes.js';
import uploadRoutes from '../backend/routes/uploadRoutes.js';
import featureRoutes from '../backend/routes/featureRoutes.js';
import analyticsRoutes from '../backend/routes/analyticsRoutes.js';
import { seedUsersToMongo } from '../backend/lib/userStore.js';
import { rewriteMediaUrls } from '../backend/lib/mediaUrl.js';

const app = express();

// Best-effort sync of seeded users (admin/demo) to MongoDB for persistence.
seedUsersToMongo();

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(cookieParser());

// Rewrites any stored media URL that points at an OLD Cloudflare tunnel
// hostname to the CURRENT media server URL (see backend/lib/mediaUrl.ts).
// Applied to every JSON response so posters/videos never die when the
// free tunnel URL rotates.
app.use((_req, res, next) => {
  const origJson = res.json.bind(res);
  res.json = ((body: unknown) => origJson(rewriteMediaUrls(body))) as typeof res.json;
  next();
});

// Vercel catch-all receives /api/...
// Express routes are mounted without the /api prefix.
app.use((req, _res, next) => {
  if (req.url === '/api') {
    req.url = '/';
  } else if (req.url.startsWith('/api/')) {
    req.url = req.url.substring(4);
  }
  next();
});

app.get('/health', (_req, res) => {
  res.status(200).json({
    status: 'ok',
    message: 'Vercel API is working'
  });
});

app.use('/auth', authRoutes);
app.use('/dramas', dramaRoutes);
app.use('/episodes', episodeRoutes);
app.use('/users', userRoutes);
app.use('/admin', adminRoutes);
app.use('/upload', uploadRoutes);
app.use('/features', featureRoutes);
app.use('/analytics', analyticsRoutes);

export default app;