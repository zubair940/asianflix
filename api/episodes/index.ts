import express from 'express';
import cors from 'cors';
import episodeRoutes from '../../backend/routes/episodeRoutes.js';

const app = express();

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

app.use((req, _res, next) => {`r`n  req.url = req.url.replace(/^\/api\/episodes/, '') || '/';`r`n  next();`r`n});`r`n`r`napp.use('/', episodeRoutes);

export default app;

