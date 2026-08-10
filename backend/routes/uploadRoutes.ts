import { Router } from 'express';
import { handleFileUpload } from '../controllers/uploadController.js';
import { upload } from '../middleware/upload.js';
import { authMiddleware } from '../middleware/auth.js';
import { adminMiddleware } from '../middleware/admin.js';

const router = Router();

router.post('/file', authMiddleware, adminMiddleware, upload.single('file'), handleFileUpload);

export default router;
