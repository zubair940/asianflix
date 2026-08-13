import express from 'express';

const app = express();

app.get('/health', (_req, res) => {
  res.status(200).json({
    status: 'ok',
    message: 'Vercel API is working'
  });
});

export default app;