import { Router } from 'express';
import {
  getAllDramas,
  getTrendingDramas,
  getLatestDramas,
  getDramasByGenre,
  getDramaById,
  createDrama,
  updateDrama,
  deleteDrama
} from '../controllers/dramaController.js';
import { authMiddleware } from '../middleware/auth.js';
import { adminMiddleware } from '../middleware/admin.js';

const router = Router();

// Enforce authentication for all drama data access
router.get('/', authMiddleware, getAllDramas);
router.get('/trending', authMiddleware, getTrendingDramas);
router.get('/latest', authMiddleware, getLatestDramas);
router.get('/genre/:genre', authMiddleware, getDramasByGenre);
router.get('/:id', authMiddleware, getDramaById);

// Admin protected routes
router.post('/', authMiddleware, adminMiddleware, createDrama);
router.put('/:id', authMiddleware, adminMiddleware, updateDrama);
router.delete('/:id', authMiddleware, adminMiddleware, deleteDrama);

export default router;
