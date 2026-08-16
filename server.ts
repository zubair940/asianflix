import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import path from 'path';
import fs from 'fs';
import helmet from 'helmet';
import { createServer as createViteServer } from 'vite';

import authRoutes from './backend/routes/authRoutes.js';
import dramaRoutes from './backend/routes/dramaRoutes.js';
import episodeRoutes from './backend/routes/episodeRoutes.js';
import userRoutes from './backend/routes/userRoutes.js';
import adminRoutes from './backend/routes/adminRoutes.js';
import uploadRoutes from './backend/routes/uploadRoutes.js';
import featureRoutes from './backend/routes/featureRoutes.js';
import analyticsRoutes from './backend/routes/analyticsRoutes.js';
import r2Routes from './backend/routes/r2Routes.js';
import { seedUsersToMongo } from './backend/lib/userStore.js';

async function startServer() {
  // Best-effort sync of seeded users (admin/demo) to MongoDB for persistence.
  seedUsersToMongo();

  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;
  const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

  // Initialize R2 Storage
  if (process.env.R2_ACCOUNT_ID && process.env.R2_ACCESS_KEY_ID && process.env.R2_SECRET_ACCESS_KEY && process.env.R2_BUCKET_NAME) {
    const { initializeR2FromEnv } = await import('./backend/lib/r2.js');
    initializeR2FromEnv();
  }

  // Security middleware
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
        styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
        fontSrc: ["'self'", 'https://fonts.gstatic.com', 'data:'],
        imgSrc: ["'self'", 'data:', 'https:', 'blob:'],
        connectSrc: ["'self'", 'https:', 'wss:'],
        mediaSrc: ["'self'", 'https:', 'blob:'],
        frameSrc: ["'self'"],
      }
    },
    crossOriginEmbedderPolicy: false
  }));

  // CORS configuration
  app.use(cors({
    origin: FRONTEND_URL,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
  }));

  // Body parsing middleware
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));
  
  // Cookie parser
  app.use(cookieParser());

  // Request logging middleware
  app.use((req, _res, next) => {
    console.log(`${new Date().toISOString()} ${req.method} ${req.path}`);
    next();
  });

  // Health check endpoint
  app.get('/api/health', (_req, res) => {
    res.json({ 
      status: 'ok', 
      time: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage()
    });
  });

  // API Routes
  app.use('/api/auth', authRoutes);
  app.use('/api/dramas', dramaRoutes);
  app.use('/api/episodes', episodeRoutes);
  app.use('/api/users', userRoutes);
  app.use('/api/admin', adminRoutes);
  app.use('/api/upload', uploadRoutes);
  app.use('/api/features', featureRoutes);
  app.use('/api/analytics', analyticsRoutes);
  app.use('/api/r2', r2Routes);

  // Development vs Production setup
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath, {
      maxAge: '1y',
      etag: true,
      lastModified: true
    }));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  // Global error handler
  app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    console.error('Server error:', err);
    res.status(500).json({ 
      message: process.env.NODE_ENV === 'production' 
        ? 'Internal server error' 
        : err.message 
    });
  });

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`AsianFlix full-stack server running on http://0.0.0.0:${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  });
}

startServer();