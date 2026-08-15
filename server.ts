import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';

import authRoutes from './backend/routes/authRoutes.js';
import dramaRoutes from './backend/routes/dramaRoutes.js';
import episodeRoutes from './backend/routes/episodeRoutes.js';
import userRoutes from './backend/routes/userRoutes.js';
import adminRoutes from './backend/routes/adminRoutes.js';
import uploadRoutes from './backend/routes/uploadRoutes.js';
import featureRoutes from './backend/routes/featureRoutes.js';

async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;

  // Middlewares
  app.use(cors());
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));

  // Health check endpoint
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', time: new Date().toISOString() });
  });

  // API Routes
  app.use('/api/auth', authRoutes);
  app.use('/api/dramas', dramaRoutes);
  app.use('/api/episodes', episodeRoutes);
  app.use('/api/users', userRoutes);
  app.use('/api/admin', adminRoutes);
  app.use('/api/upload', uploadRoutes);
  app.use('/api/features', featureRoutes);

  // Development vs Production setup
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`ðŸŽ¬ K-Drama Box full-stack server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();

