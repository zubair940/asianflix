import express from 'express';
import cors from 'cors';

import authRoutes from '../backend/routes/authRoutes.js';
import dramaRoutes from '../backend/routes/dramaRoutes.js';
import episodeRoutes from '../backend/routes/episodeRoutes.js';
import userRoutes from '../backend/routes/userRoutes.js';
import adminRoutes from '../backend/routes/adminRoutes.js';
import uploadRoutes from '../backend/routes/uploadRoutes.js';
import featureRoutes from '../backend/routes/featureRoutes.js';

const app = express();

app.use(cors());

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Vercel normally passes the path without /api.
// This also safely handles /api/... if it is present.
app.use((req, _res, next) => {
  if (req.url === '/api') {
    req.url = '/';
  } else if (req.url.startsWith('/api/')) {
    req.url = req.url.substring(4);
  }

  next();
});

// Health check
app.get('/health', (_req, res) => {
  res.status(200).json({
    status: 'ok',
    message: 'Vercel API is working'
  });
});

// API routes
app.use('/auth', authRoutes);
app.use('/dramas', dramaRoutes);
app.use('/episodes', episodeRoutes);
app.use('/users', userRoutes);
app.use('/admin', adminRoutes);
app.use('/upload', uploadRoutes);
app.use('/features', featureRoutes);

// JSON 404 instead of returning HTML
app.use((_req, res) => {
  res.status(404).json({
    status: 'error',
    message: 'API endpoint not found'
  });
});

// JSON error handler
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('API Error:', err);

  res.status(err?.status || 500).json({
    status: 'error',
    message: err?.message || 'Internal server error'
  });
});

export default app;