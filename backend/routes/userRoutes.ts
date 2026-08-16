import { Router } from 'express';
import {
  toggleWatchlist,
  getWatchlist,
  updateWatchHistory,
  getWatchHistory,
  clearWatchHistory,
  addRating,
  getUserRatings,
  getAvailableAvatars,
  updateProfile,
  changePassword,
  deleteAccount
} from '../controllers/userController.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

router.put('/watchlist', authMiddleware, toggleWatchlist);
router.get('/watchlist', authMiddleware, getWatchlist);
router.put('/history', authMiddleware, updateWatchHistory);
router.get('/history', authMiddleware, getWatchHistory);
router.delete('/history', authMiddleware, clearWatchHistory);
router.post('/rating', authMiddleware, addRating);
router.get('/ratings', authMiddleware, getUserRatings);
router.get('/avatars', getAvailableAvatars);
router.put('/profile', authMiddleware, updateProfile);
router.put('/password', authMiddleware, changePassword);
router.delete('/account', authMiddleware, deleteAccount);

export default router;