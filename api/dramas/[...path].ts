import express from 'express';
import cors from 'cors';
import dramaRoutes from '../../backend/routes/dramaRoutes.js';

const app = express();

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

app.use((req, _res, next) => {
  req.url = req.url.replace(/^\/api\/dramas/, '') || '/';
  next();
});

app.use('/', dramaRoutes);

export default app;
