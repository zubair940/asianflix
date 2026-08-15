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
router.get('/', getAllDramas);
router.get('/trending', getTrendingDramas);
router.get('/latest', getLatestDramas);
router.get('/genre/:genre', getDramasByGenre);
router.get('/:id', getDramaById);

// Admin protected routes
router.post('/', authMiddleware, adminMiddleware, createDrama);
router.put('/:id', authMiddleware, adminMiddleware, updateDrama);
router.delete('/:id', authMiddleware, adminMiddleware, deleteDrama);

export default router;
