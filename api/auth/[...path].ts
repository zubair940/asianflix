import express from 'express';
import cors from 'cors';
import authRoutes from '../../backend/routes/authRoutes.js';

const app = express();

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

app.use((req, _res, next) => {
  if (req.url.startsWith('/api/auth/')) {
    req.url = req.url.substring(9);
  } else if (req.url === '/api/auth') {
    req.url = '/';
  }
  next();
});

app.use(authRoutes);

export default app;
