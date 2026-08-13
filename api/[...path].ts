import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';

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

const uploadsDir = path.join(process.cwd(), 'uploads');

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

app.use(
  '/api/uploads',
  express.static(uploadsDir, {
    acceptRanges: true,
    setHeaders: (res) => {
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
      res.setHeader(
        'Access-Control-Allow-Headers',
        'Origin, X-Requested-With, Content-Type, Accept, Range'
      );
      res.setHeader('Accept-Ranges', 'bytes');
    }
  })
);

app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    time: new Date().toISOString()
  });
});

app.use('/auth', authRoutes);
app.use('/dramas', dramaRoutes);
app.use('/episodes', episodeRoutes);
app.use('/users', userRoutes);
app.use('/admin', adminRoutes);
app.use('/upload', uploadRoutes);
app.use('/features', featureRoutes);

export default app;