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

// Health check
app.get('/health', (_req, res) => {
  res.json({
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

export default app;