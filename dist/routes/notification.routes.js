"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const notification_controller_1 = __importDefault(require("../controllers/notification.controller"));
const auth_middleware_1 = require("../middlewares/auth.middleware");
const rateLimiter_middleware_1 = require("../middlewares/rateLimiter.middleware");
const router = express_1.default.Router();
// Apply authentication middleware to all notification routes
router.use(auth_middleware_1.authenticate);
// Apply rate limiting
router.use(rateLimiter_middleware_1.generalLimiter);
// Get user's notifications with pagination and filtering
// Query params: page, limit, isRead, type, priority, fromDate, toDate, actorId
router.get('/', notification_controller_1.default.getNotifications);
// Get notification statistics (unread count, etc.)
router.get('/stats', notification_controller_1.default.getNotificationStats);
// Get notification metadata (types, priorities for frontend)
router.get('/metadata', notification_controller_1.default.getNotificationMetadata);
// Mark specific notifications as read
// Body: { notificationIds: string[] }
router.patch('/read', notification_controller_1.default.markAsRead);
// Mark all notifications as read
router.patch('/read-all', notification_controller_1.default.markAllAsRead);
// Delete specific notifications
// Body: { notificationIds: string[] }
router.delete('/', notification_controller_1.default.deleteNotifications);
// Test endpoint for development (create sample notification)
router.post('/test', notification_controller_1.default.createTestNotification);
exports.default = router;
