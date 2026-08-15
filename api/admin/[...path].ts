import express from 'express';
import cors from 'cors';

import adminRoutes from '../../backend/routes/adminRoutes.js';

const app = express();

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

app.use((req, _res, next) => {
  if (req.url.startsWith('/api/admin/')) {
    req.url = req.url.substring(10);
  } else if (req.url === '/api/admin') {
    req.url = '/';
  }

  next();
});

app.use(adminRoutes);

export default app;