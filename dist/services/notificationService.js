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
const prisma_1 = __importDefault(require("../config/prisma"));
const socket_1 = require("../utils/socket");
const notification_types_1 = require("../types/notification.types");
class NotificationService {
    constructor() {
        this.CACHE_PREFIX = 'notifications:';
        this.CACHE_TTL = 3600; // 1 hour
        this.BATCH_SIZE = 100;
    }
    /**
     * Create a single notification
     */
    createNotification(data) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                // Check if similar notification already exists (to prevent spam)
                const existingNotification = yield this.findSimilarNotification(data);
                if (existingNotification) {
                    return this.formatNotificationResponse(existingNotification);
                }
                // Create the notification
                const notification = yield prisma_1.default.notification.create({
                    data: {
                        userId: data.userId,
                        actorId: data.actorId,
                        type: data.type,
                        title: data.title,
                        message: data.message,
                        targetId: data.targetId,
                        targetType: data.targetType,
                        metadata: data.metadata || {},
                        priority: data.priority || notification_types_1.NotificationPriority.NORMAL
                    },
                    include: {
                        actor: {
                            select: {
                                id: true,
                                username: true,
                                firstName: true,
                                lastName: true,
                                profilePictureUrl: true
                            }
                        }
                    }
                });
                // Clear user's notification cache
                yield this.clearUserNotificationCache(data.userId);
                // Send real-time notification
                yield this.sendRealTimeNotification(notification);
                return this.formatNotificationResponse(notification);
            }
            catch (error) {
                console.error('Error creating notification:', error);
                throw new Error('Failed to create notification');
            }
        });
    }
    /**
     * Create notifications for multiple users (batch operation)
     */
    createBatchNotifications(data) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { userIds, actorId, type, targetId, targetType, metadata } = data;
                // Get template for this notification type
                const template = notification_types_1.NotificationTemplates[type];
                if (!template) {
                    throw new Error(`Unknown notification type: ${type}`);
                }
                // Get actor information
                let actorName = 'Someone';
                let actor = null;
                if (actorId) {
                    actor = yield prisma_1.default.user.findUnique({
                        where: { id: actorId },
                        select: {
                            id: true,
                            username: true,
                            firstName: true,
                            lastName: true,
                            profilePictureUrl: true
                        }
                    });
                    actorName = (actor === null || actor === void 0 ? void 0 : actor.firstName) && (actor === null || actor === void 0 ? void 0 : actor.lastName)
                        ? `${actor.firstName} ${actor.lastName}`
                        : (actor === null || actor === void 0 ? void 0 : actor.username) || 'Someone';
                }
                // Process in batches to avoid overwhelming the database
                for (let i = 0; i < userIds.length; i += this.BATCH_SIZE) {
                    const batch = userIds.slice(i, i + this.BATCH_SIZE);
                    // Filter out users who already have similar notifications
                    const filteredUserIds = yield this.filterUsersWithSimilarNotifications(batch, type, actorId, targetId);
                    if (filteredUserIds.length === 0)
                        continue;
                    // Create notifications for this batch
                    const notifications = filteredUserIds.map(userId => ({
                        userId,
                        actorId,
                        type,
                        title: template.title,
                        message: template.getMessage(actorName),
                        targetId,
                        targetType,
                        metadata: metadata || {},
                        priority: template.priority
                    }));
                    yield prisma_1.default.notification.createMany({
                        data: notifications,
                        skipDuplicates: true
                    });
                    // Clear cache for all users in this batch
                    yield Promise.all(filteredUserIds.map(userId => this.clearUserNotificationCache(userId)));
                    // Send real-time notifications
                    yield this.sendBatchRealTimeNotifications(filteredUserIds, {
                        type,
                        title: template.title,
                        message: template.getMessage(actorName),
                        actor,
                        targetId,
                        targetType,
                        metadata: metadata || {},
                        priority: template.priority
                    });
                }
            }
            catch (error) {
                console.error('Error creating batch notifications:', error);
                throw new Error('Failed to create batch notifications');
            }
        });
    }
    /**
     * Get paginated notifications for a user
     */
    getUserNotifications(userId_1) {
        return __awaiter(this, arguments, void 0, function* (userId, page = 1, limit = 20, filters) {
            try {
                const offset = (page - 1) * limit;
                // Build where clause
                const whereClause = { userId };
                if (filters) {
                    if (filters.isRead !== undefined) {
                        whereClause.isRead = filters.isRead;
                    }
                    if (filters.type) {
                        whereClause.type = Array.isArray(filters.type)
                            ? { in: filters.type }
                            : filters.type;
                    }
                    if (filters.priority) {
                        whereClause.priority = Array.isArray(filters.priority)
                            ? { in: filters.priority }
                            : filters.priority;
                    }
                    if (filters.fromDate || filters.toDate) {
                        whereClause.createdAt = {};
                        if (filters.fromDate)
                            whereClause.createdAt.gte = filters.fromDate;
                        if (filters.toDate)
                            whereClause.createdAt.lte = filters.toDate;
                    }
                    if (filters.actorId) {
                        whereClause.actorId = filters.actorId;
                    }
                }
                // Get notifications and total count
                const [notifications, total] = yield Promise.all([
                    prisma_1.default.notification.findMany({
                        where: whereClause,
                        include: {
                            actor: {
                                select: {
                                    id: true,
                                    username: true,
                                    firstName: true,
                                    lastName: true,
                                    profilePictureUrl: true
                                }
                            }
                        },
                        orderBy: [
                            { priority: 'desc' },
                            { createdAt: 'desc' }
                        ],
                        skip: offset,
                        take: limit
                    }),
                    prisma_1.default.notification.count({ where: whereClause })
                ]);
                // Get stats
                const stats = yield this.getUserNotificationStats(userId);
                const result = {
                    notifications: notifications.map(this.formatNotificationResponse),
                    pagination: {
                        page,
                        limit,
                        total,
                        totalPages: Math.ceil(total / limit),
                        hasNext: offset + limit < total,
                        hasPrev: page > 1
                    },
                    stats
                };
                return result;
            }
            catch (error) {
                console.error('Error getting user notifications:', error);
                throw new Error('Failed to get notifications');
            }
        });
    }
    /**
     * Mark notification(s) as read
     */
    markAsRead(notificationIds) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield prisma_1.default.notification.updateMany({
                    where: {
                        id: { in: notificationIds }
                    },
                    data: {
                        isRead: true,
                        updatedAt: new Date()
                    }
                });
                // Clear cache for affected users
                const affectedNotifications = yield prisma_1.default.notification.findMany({
                    where: { id: { in: notificationIds } },
                    select: { userId: true }
                });
                const userIds = [...new Set(affectedNotifications.map(n => n.userId))];
                yield Promise.all(userIds.map(userId => this.clearUserNotificationCache(userId)));
            }
            catch (error) {
                console.error('Error marking notifications as read:', error);
                throw new Error('Failed to mark notifications as read');
            }
        });
    }
    /**
     * Mark all notifications as read for a user
     */
    markAllAsRead(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield prisma_1.default.notification.updateMany({
                    where: {
                        userId,
                        isRead: false
                    },
                    data: {
                        isRead: true,
                        updatedAt: new Date()
                    }
                });
                yield this.clearUserNotificationCache(userId);
            }
            catch (error) {
                console.error('Error marking all notifications as read:', error);
                throw new Error('Failed to mark all notifications as read');
            }
        });
    }
    /**
     * Delete notifications
     */
    deleteNotifications(notificationIds) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                // Get affected users before deletion
                const affectedNotifications = yield prisma_1.default.notification.findMany({
                    where: { id: { in: notificationIds } },
                    select: { userId: true }
                });
                yield prisma_1.default.notification.deleteMany({
                    where: { id: { in: notificationIds } }
                });
                // Clear cache for affected users
                const userIds = [...new Set(affectedNotifications.map(n => n.userId))];
                yield Promise.all(userIds.map(userId => this.clearUserNotificationCache(userId)));
            }
            catch (error) {
                console.error('Error deleting notifications:', error);
                throw new Error('Failed to delete notifications');
            }
        });
    }
    /**
     * Get notification statistics for a user
     */
    getUserNotificationStats(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const [total, unread, byType, byPriority] = yield Promise.all([
                    prisma_1.default.notification.count({ where: { userId } }),
                    prisma_1.default.notification.count({ where: { userId, isRead: false } }),
                    prisma_1.default.notification.groupBy({
                        by: ['type'],
                        where: { userId },
                        _count: { type: true }
                    }),
                    prisma_1.default.notification.groupBy({
                        by: ['priority'],
                        where: { userId },
                        _count: { priority: true }
                    })
                ]);
                const stats = {
                    total,
                    unread,
                    byType: byType.reduce((acc, item) => {
                        acc[item.type] = item._count.type;
                        return acc;
                    }, {}),
                    byPriority: byPriority.reduce((acc, item) => {
                        acc[item.priority] = item._count.priority;
                        return acc;
                    }, {})
                };
                return stats;
            }
            catch (error) {
                console.error('Error getting notification stats:', error);
                throw new Error('Failed to get notification stats');
            }
        });
    }
    /**
     * Clean up old notifications (for maintenance)
     */
    cleanupOldNotifications() {
        return __awaiter(this, arguments, void 0, function* (daysOld = 30) {
            try {
                const cutoffDate = new Date();
                cutoffDate.setDate(cutoffDate.getDate() - daysOld);
                const result = yield prisma_1.default.notification.deleteMany({
                    where: {
                        createdAt: { lt: cutoffDate },
                        isRead: true
                    }
                });
                console.log(`Cleaned up ${result.count} old notifications`);
                return result.count;
            }
            catch (error) {
                console.error('Error cleaning up old notifications:', error);
                throw new Error('Failed to cleanup old notifications');
            }
        });
    }
    // Private helper methods
    findSimilarNotification(data) {
        return __awaiter(this, void 0, void 0, function* () {
            const timeWindow = 5 * 60 * 1000; // 5 minutes
            const cutoffTime = new Date(Date.now() - timeWindow);
            return yield prisma_1.default.notification.findFirst({
                where: {
                    userId: data.userId,
                    actorId: data.actorId,
                    type: data.type,
                    targetId: data.targetId,
                    createdAt: { gte: cutoffTime }
                },
                include: {
                    actor: {
                        select: {
                            id: true,
                            username: true,
                            firstName: true,
                            lastName: true,
                            profilePictureUrl: true
                        }
                    }
                }
            });
        });
    }
    filterUsersWithSimilarNotifications(userIds, type, actorId, targetId) {
        return __awaiter(this, void 0, void 0, function* () {
            const timeWindow = 5 * 60 * 1000; // 5 minutes
            const cutoffTime = new Date(Date.now() - timeWindow);
            const existingNotifications = yield prisma_1.default.notification.findMany({
                where: {
                    userId: { in: userIds },
                    actorId,
                    type,
                    targetId,
                    createdAt: { gte: cutoffTime }
                },
                select: { userId: true }
            });
            const existingUserIds = new Set(existingNotifications.map(n => n.userId));
            return userIds.filter(userId => !existingUserIds.has(userId));
        });
    }
    sendRealTimeNotification(notification) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                if (socket_1.io) {
                    const formattedNotification = this.formatNotificationResponse(notification);
                    socket_1.io.to(notification.userId).emit('newNotification', formattedNotification);
                    // Also emit unread count update
                    const stats = yield this.getUserNotificationStats(notification.userId);
                    socket_1.io.to(notification.userId).emit('notificationStatsUpdate', stats);
                }
            }
            catch (error) {
                console.error('Error sending real-time notification:', error);
            }
        });
    }
    sendBatchRealTimeNotifications(userIds, notificationData) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                if (socket_1.io) {
                    userIds.forEach(userId => {
                        socket_1.io.to(userId).emit('newNotification', Object.assign(Object.assign({}, notificationData), { userId, id: 'temp-' + Date.now(), isRead: false, createdAt: new Date(), updatedAt: new Date() }));
                    });
                }
            }
            catch (error) {
                console.error('Error sending batch real-time notifications:', error);
            }
        });
    }
    clearUserNotificationCache(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                // Since we don't have complex caching yet, just log
                console.log(`Clearing notification cache for user: ${userId}`);
            }
            catch (error) {
                console.error('Error clearing user notification cache:', error);
            }
        });
    }
    formatNotificationResponse(notification) {
        return {
            id: notification.id,
            userId: notification.userId,
            actorId: notification.actorId,
            type: notification.type,
            title: notification.title,
            message: notification.message,
            targetId: notification.targetId,
            targetType: notification.targetType,
            metadata: notification.metadata,
            isRead: notification.isRead,
            priority: notification.priority,
            createdAt: notification.createdAt,
            updatedAt: notification.updatedAt,
            actor: notification.actor
        };
    }
}
exports.default = new NotificationService();
