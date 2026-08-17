import { Router } from 'express';
import {
  getAllEpisodes,
  getEpisodesByDrama,
  createEpisode,
  updateEpisode,
  replaceEpisodeVideo,
  updateEpisodeSubtitle,
  deleteEpisode,
  reorderEpisodes,
  bulkCreateEpisodes
} from '../controllers/episodeController.js';
import { authMiddleware } from '../middleware/auth.js';
import { adminMiddleware } from '../middleware/admin.js';

const router = Router();

// Mandatory authentication for fetching episodes
router.get('/', getAllEpisodes);
router.get('/drama/:dramaId', getEpisodesByDrama);

// Admin routes
router.post('/', authMiddleware, adminMiddleware, createEpisode);
router.post('/bulk-upload', authMiddleware, adminMiddleware, bulkCreateEpisodes);
router.post('/reorder', authMiddleware, adminMiddleware, reorderEpisodes);
router.put('/:id', authMiddleware, adminMiddleware, updateEpisode);
router.put('/:id/video', authMiddleware, adminMiddleware, replaceEpisodeVideo);
router.put('/:id/subtitle', authMiddleware, adminMiddleware, updateEpisodeSubtitle);
router.delete('/:id', authMiddleware, adminMiddleware, deleteEpisode);

export default router;
