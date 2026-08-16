import { Router } from 'express';
import {
  getDashboardStats,
  getRealtimeStats,
  getDramaAnalytics,
  getUserEngagement,
  getContentPerformance,
  getUserRetention,
  getAnalyticsEvents,
  trackEvent
} from '../controllers/analyticsController.js';
import { authMiddleware } from '../middleware/auth.js';
import { adminMiddleware } from '../middleware/admin.js';

const router = Router();

// Public endpoint for tracking events
router.post('/track', trackEvent);

// Admin only routes
router.use(authMiddleware, adminMiddleware);

router.get('/dashboard', getDashboardStats);
router.get('/realtime', getRealtimeStats);
router.get('/drama/:dramaId', getDramaAnalytics);
router.get('/users/engagement', getUserEngagement);
router.get('/content/performance', getContentPerformance);
router.get('/users/retention', getUserRetention);
router.get('/events', getAnalyticsEvents);

export default router;