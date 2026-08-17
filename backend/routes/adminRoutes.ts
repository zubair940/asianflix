import { Router } from 'express';
import {
  getDashboardStats,
  getAllUsers,
  toggleBlockUser,
  deleteUser,
  deleteReview
} from '../controllers/adminController.js';
import { generateUploadPresignUrl, generateClientUploadToken, getStorageStatusHandler } from '../controllers/uploadController.js';
import { listBlobs, cleanupUnusedBlobs } from '../controllers/blobController.js';
import { authMiddleware } from '../middleware/auth.js';
import { adminMiddleware } from '../middleware/admin.js';

const router = Router();

router.use(authMiddleware, adminMiddleware);

router.get('/dashboard', getDashboardStats);
router.get('/users', getAllUsers);
router.put('/users/:id/block', toggleBlockUser);
router.delete('/users/:id', deleteUser);
router.delete('/reviews/:id', deleteReview);
router.post('/upload/presigned-url', generateUploadPresignUrl);
router.post('/upload/client-token', generateClientUploadToken);
router.get('/storage-status', getStorageStatusHandler);
router.get('/blob/list', listBlobs);
router.post('/blob/cleanup', cleanupUnusedBlobs);

export default router;
