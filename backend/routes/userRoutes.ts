import { Router } from 'express';
import {
  toggleWatchlist,
  getWatchlist,
  updateWatchHistory,
  getWatchHistory,
  addRating
} from '../controllers/userController.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

router.put('/watchlist', authMiddleware, toggleWatchlist);
router.get('/watchlist', authMiddleware, getWatchlist);
router.put('/history', authMiddleware, updateWatchHistory);
router.get('/history', authMiddleware, getWatchHistory);
router.post('/rating', authMiddleware, addRating);

export default router;
