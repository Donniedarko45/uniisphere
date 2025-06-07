"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const notificationService_1 = __importDefault(require("../services/notificationService"));
const notification_types_1 = require("../types/notification.types");
class NotificationController {
    /**
     * Get user's notifications with pagination and filtering
     * GET /api/notifications
     */
    getNotifications(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const userId = req.userId;
                if (!userId) {
                    return res.status(401).json({
                        success: false,
                        message: 'User not authenticated'
                    });
                }
                const { page = '1', limit = '20', isRead, type, priority, fromDate, toDate, actorId } = req.query;
                // Build filters
                const filters = {};
                if (isRead !== undefined) {
                    filters.isRead = isRead === 'true';
                }
                if (type) {
                    if (Array.isArray(type)) {
                        filters.type = type;
                    }
                    else {
                        filters.type = type;
                    }
                }
                if (priority) {
                    if (Array.isArray(priority)) {
                        filters.priority = priority;
                    }
                    else {
                        filters.priority = priority;
                    }
                }
                if (fromDate) {
                    filters.fromDate = new Date(fromDate);
                }
                if (toDate) {
                    filters.toDate = new Date(toDate);
                }
                if (actorId) {
                    filters.actorId = actorId;
                }
                const result = yield notificationService_1.default.getUserNotifications(userId, parseInt(page), parseInt(limit), filters);
                res.status(200).json({
                    success: true,
                    data: result
                });
            }
            catch (error) {
                console.error('Error getting notifications:', error);
                res.status(500).json({
                    success: false,
                    message: 'Failed to get notifications'
                });
            }
        });
    }
    /**
     * Get notification statistics
     * GET /api/notifications/stats
     */
    getNotificationStats(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const userId = req.userId;
                if (!userId) {
                    return res.status(401).json({
                        success: false,
                        message: 'User not authenticated'
                    });
                }
                const stats = yield notificationService_1.default.getUserNotificationStats(userId);
                res.status(200).json({
                    success: true,
                    data: stats
                });
            }
            catch (error) {
                console.error('Error getting notification stats:', error);
                res.status(500).json({
                    success: false,
                    message: 'Failed to get notification statistics'
                });
            }
        });
    }
    /**
     * Mark specific notifications as read
     * PATCH /api/notifications/read
     */
    markAsRead(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const userId = req.userId;
                if (!userId) {
                    return res.status(401).json({
                        success: false,
                        message: 'User not authenticated'
                    });
                }
                const { notificationIds } = req.body;
                if (!Array.isArray(notificationIds) || notificationIds.length === 0) {
                    return res.status(400).json({
                        success: false,
                        message: 'Invalid notification IDs provided'
                    });
                }
                yield notificationService_1.default.markAsRead(notificationIds);
                // Get updated stats
                const stats = yield notificationService_1.default.getUserNotificationStats(userId);
                res.status(200).json({
                    success: true,
                    message: 'Notifications marked as read',
                    data: { stats }
                });
            }
            catch (error) {
                console.error('Error marking notifications as read:', error);
                res.status(500).json({
                    success: false,
                    message: 'Failed to mark notifications as read'
                });
            }
        });
    }
    /**
     * Mark all notifications as read
     * PATCH /api/notifications/read-all
     */
    markAllAsRead(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const userId = req.userId;
                if (!userId) {
                    return res.status(401).json({
                        success: false,
                        message: 'User not authenticated'
                    });
                }
                yield notificationService_1.default.markAllAsRead(userId);
                // Get updated stats
                const stats = yield notificationService_1.default.getUserNotificationStats(userId);
                res.status(200).json({
                    success: true,
                    message: 'All notifications marked as read',
                    data: { stats }
                });
            }
            catch (error) {
                console.error('Error marking all notifications as read:', error);
                res.status(500).json({
                    success: false,
                    message: 'Failed to mark all notifications as read'
                });
            }
        });
    }
    /**
     * Delete specific notifications
     * DELETE /api/notifications
     */
    deleteNotifications(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const userId = req.userId;
                if (!userId) {
                    return res.status(401).json({
                        success: false,
                        message: 'User not authenticated'
                    });
                }
                const { notificationIds } = req.body;
                if (!Array.isArray(notificationIds) || notificationIds.length === 0) {
                    return res.status(400).json({
                        success: false,
                        message: 'Invalid notification IDs provided'
                    });
                }
                yield notificationService_1.default.deleteNotifications(notificationIds);
                // Get updated stats
                const stats = yield notificationService_1.default.getUserNotificationStats(userId);
                res.status(200).json({
                    success: true,
                    message: 'Notifications deleted successfully',
                    data: { stats }
                });
            }
            catch (error) {
                console.error('Error deleting notifications:', error);
                res.status(500).json({
                    success: false,
                    message: 'Failed to delete notifications'
                });
            }
        });
    }
    /**
     * Test endpoint to create a sample notification (for development)
     * POST /api/notifications/test
     */
    createTestNotification(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const userId = req.userId;
                if (!userId) {
                    return res.status(401).json({
                        success: false,
                        message: 'User not authenticated'
                    });
                }
                const notification = yield notificationService_1.default.createNotification({
                    userId,
                    type: notification_types_1.NotificationType.WELCOME,
                    title: 'Test Notification',
                    message: 'This is a test notification created for development purposes.',
                    priority: notification_types_1.NotificationPriority.NORMAL
                });
                res.status(201).json({
                    success: true,
                    message: 'Test notification created',
                    data: notification
                });
            }
            catch (error) {
                console.error('Error creating test notification:', error);
                res.status(500).json({
                    success: false,
                    message: 'Failed to create test notification'
                });
            }
        });
    }
    /**
     * Get notification types and priorities (for frontend dropdowns)
     * GET /api/notifications/metadata
     */
    getNotificationMetadata(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const types = Object.values(notification_types_1.NotificationType);
                const priorities = Object.values(notification_types_1.NotificationPriority);
                res.status(200).json({
                    success: true,
                    data: {
                        types,
                        priorities
                    }
                });
            }
            catch (error) {
                console.error('Error getting notification metadata:', error);
                res.status(500).json({
                    success: false,
                    message: 'Failed to get notification metadata'
                });
            }
        });
    }
}
exports.default = new NotificationController();
