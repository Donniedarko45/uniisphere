import express from 'express';
import notificationController from '../controllers/notification.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { generalLimiter } from '../middlewares/rateLimiter.middleware';

const router = express.Router();

// Apply authentication middleware to all notification routes
router.use(authenticate);

// Apply rate limiting
router.use(generalLimiter);

// Get user's notifications with pagination and filtering
// Query params: page, limit, isRead, type, priority, fromDate, toDate, actorId
router.get('/', notificationController.getNotifications);

// Get notification statistics (unread count, etc.)
router.get('/stats', notificationController.getNotificationStats);

// Get notification metadata (types, priorities for frontend)
router.get('/metadata', notificationController.getNotificationMetadata);

// Mark specific notifications as read
// Body: { notificationIds: string[] }
router.patch('/read', notificationController.markAsRead);

// Mark all notifications as read
router.patch('/read-all', notificationController.markAllAsRead);

// Delete specific notifications
// Body: { notificationIds: string[] }
router.delete('/', notificationController.deleteNotifications);

// Test endpoint for development (create sample notification)
router.post('/test', notificationController.createTestNotification);

export default router; 