import { Router } from 'express';
import { 
  register, 
  login, 
  logout, 
  refreshToken, 
  getMe, 
  updateProfile, 
  changePassword 
} from '../controllers/authController.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.post('/logout', logout);
router.post('/refresh', refreshToken);
router.get('/me', authMiddleware, getMe);
router.put('/update', authMiddleware, updateProfile);
router.put('/password', authMiddleware, changePassword);

export default router;