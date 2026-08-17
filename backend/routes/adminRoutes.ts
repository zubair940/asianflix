import { Router } from 'express';
import {
  getDashboardStats,
  getAllUsers,
  toggleBlockUser,
  deleteUser,
  deleteReview
} from '../controllers/adminController.js';
import { generateUploadPresignUrl } from '../controllers/uploadController.js';
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

export default router;
