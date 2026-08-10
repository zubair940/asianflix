import { Router } from 'express';
import { authMiddleware as authenticateToken } from '../middleware/auth.js';
import { adminMiddleware as requireAdmin } from '../middleware/admin.js';
import {
  getDanmaku,
  postDanmaku,
  deleteDanmaku,
  getAllDanmakuAdmin,
  createWatchParty,
  getWatchParty,
  sendWatchPartyMessage,
  getHeroBanners,
  saveHeroBanner,
  deleteHeroBanner,
  getCollections,
  createCollection,
  deleteCollection,
  bulkGenerateEpisodes
} from '../controllers/featureController.js';

const router = Router();

// Danmaku routes
router.get('/danmaku/:episodeId', getDanmaku);
router.post('/danmaku', authenticateToken, postDanmaku);
router.get('/admin/danmaku', authenticateToken, requireAdmin, getAllDanmakuAdmin);
router.delete('/admin/danmaku/:id', authenticateToken, requireAdmin, deleteDanmaku);

// Watch party routes
router.post('/watch-party', authenticateToken, createWatchParty);
router.get('/watch-party/:code', getWatchParty);
router.post('/watch-party/:code/message', authenticateToken, sendWatchPartyMessage);

// Hero Banners
router.get('/banners', getHeroBanners);
router.post('/admin/banners', authenticateToken, requireAdmin, saveHeroBanner);
router.delete('/admin/banners/:id', authenticateToken, requireAdmin, deleteHeroBanner);

// Collections
router.get('/collections', getCollections);
router.post('/collections', authenticateToken, createCollection);
router.delete('/collections/:id', authenticateToken, deleteCollection);

// Bulk episode generator
router.post('/admin/episodes/bulk', authenticateToken, requireAdmin, bulkGenerateEpisodes);

export default router;
