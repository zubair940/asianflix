import express from 'express';
import cors from 'cors';
import episodeRoutes from '../../../backend/routes/episodeRoutes.js';

const app = express();

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

app.use((req, _res, next) => {
  const match = req.url.match(/\/api\/episodes\/drama\/([^?]+)/);
  if (match) {
    req.url = '/drama/' + match[1];
  } else {
    req.url = '/';
  }
  next();
});

app.use('/', episodeRoutes);

export default app;
