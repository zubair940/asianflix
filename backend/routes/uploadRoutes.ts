import { Router } from 'express';
import { handleFileUpload } from '../controllers/uploadController.js';
import { upload } from '../middleware/upload.js';
import { authMiddleware } from '../middleware/auth.js';
import { adminMiddleware } from '../middleware/admin.js';
import { uploadToVercelBlob, deleteFromVercelBlob, getVercelBlobInfo } from '../controllers/vercelBlobController.js';

const router = Router();

// Local media server upload (existing)
router.post('/file', authMiddleware, adminMiddleware, upload.single('file'), handleFileUpload);

// Vercel Blob upload (fast CDN upload for large files)
router.post('/vercel-blob', authMiddleware, adminMiddleware, upload.single('file'), uploadToVercelBlob);
router.delete('/vercel-blob', authMiddleware, adminMiddleware, deleteFromVercelBlob);
router.get('/vercel-blob/info', authMiddleware, adminMiddleware, getVercelBlobInfo);

export default router;
