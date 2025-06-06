import { Notification, User } from '@prisma/client';
import prisma from '../config/prisma';
import redisManager from '../config/redis';
import { io } from '../utils/socket';
import {
  CreateNotificationData,
  NotificationResponse,
  NotificationFilters,
  PaginatedNotifications,
  NotificationStats,
  NotificationType,
  NotificationPriority,
  NotificationTemplates,
  TargetType
} from '../types/notification.types';

interface BatchNotificationData {
  userIds: string[];
  actorId?: string;
  type: NotificationType;
  targetId?: string;
  targetType?: TargetType;
  metadata?: any;
}

class NotificationService {
  private readonly CACHE_PREFIX = 'notifications:';
  private readonly CACHE_TTL = 3600; // 1 hour
  private readonly BATCH_SIZE = 100;

  /**
   * Create a single notification
   */
  async createNotification(data: CreateNotificationData): Promise<NotificationResponse> {
    try {
      // Check if similar notification already exists (to prevent spam)
      const existingNotification = await this.findSimilarNotification(data);
      if (existingNotification) {
        return this.formatNotificationResponse(existingNotification);
      }

      // Create the notification
      const notification = await prisma.notification.create({
        data: {
          userId: data.userId,
          actorId: data.actorId,
          type: data.type,
          title: data.title,
          message: data.message,
          targetId: data.targetId,
          targetType: data.targetType,
          metadata: data.metadata || {},
          priority: data.priority || NotificationPriority.NORMAL
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
      await this.clearUserNotificationCache(data.userId);

      // Send real-time notification
      await this.sendRealTimeNotification(notification);

      return this.formatNotificationResponse(notification);
    } catch (error) {
      console.error('Error creating notification:', error);
      throw new Error('Failed to create notification');
    }
  }

  /**
   * Create notifications for multiple users (batch operation)
   */
  async createBatchNotifications(data: BatchNotificationData): Promise<void> {
    try {
      const { userIds, actorId, type, targetId, targetType, metadata } = data;
      
      // Get template for this notification type
      const template = NotificationTemplates[type];
      if (!template) {
        throw new Error(`Unknown notification type: ${type}`);
      }

      // Get actor information
      let actorName = 'Someone';
      let actor = null;
      if (actorId) {
        actor = await prisma.user.findUnique({
          where: { id: actorId },
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
            profilePictureUrl: true
          }
        });
        actorName = actor?.firstName && actor?.lastName 
          ? `${actor.firstName} ${actor.lastName}`
          : actor?.username || 'Someone';
      }

      // Process in batches to avoid overwhelming the database
      for (let i = 0; i < userIds.length; i += this.BATCH_SIZE) {
        const batch = userIds.slice(i, i + this.BATCH_SIZE);
        
        // Filter out users who already have similar notifications
        const filteredUserIds = await this.filterUsersWithSimilarNotifications(
          batch, type, actorId, targetId
        );

        if (filteredUserIds.length === 0) continue;

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

        await prisma.notification.createMany({
          data: notifications,
          skipDuplicates: true
        });

        // Clear cache for all users in this batch
        await Promise.all(
          filteredUserIds.map(userId => this.clearUserNotificationCache(userId))
        );

        // Send real-time notifications
        await this.sendBatchRealTimeNotifications(filteredUserIds, {
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
    } catch (error) {
      console.error('Error creating batch notifications:', error);
      throw new Error('Failed to create batch notifications');
    }
  }

  /**
   * Get paginated notifications for a user
   */
  async getUserNotifications(
    userId: string,
    page: number = 1,
    limit: number = 20,
    filters?: NotificationFilters
  ): Promise<PaginatedNotifications> {
    try {
      const offset = (page - 1) * limit;

      // Build where clause
      const whereClause: any = { userId };
      
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
          if (filters.fromDate) whereClause.createdAt.gte = filters.fromDate;
          if (filters.toDate) whereClause.createdAt.lte = filters.toDate;
        }
        if (filters.actorId) {
          whereClause.actorId = filters.actorId;
        }
      }

      // Get notifications and total count
      const [notifications, total] = await Promise.all([
        prisma.notification.findMany({
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
        prisma.notification.count({ where: whereClause })
      ]);

      // Get stats
      const stats = await this.getUserNotificationStats(userId);

      const result: PaginatedNotifications = {
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
    } catch (error) {
      console.error('Error getting user notifications:', error);
      throw new Error('Failed to get notifications');
    }
  }

  /**
   * Mark notification(s) as read
   */
  async markAsRead(notificationIds: string[]): Promise<void> {
    try {
      await prisma.notification.updateMany({
        where: {
          id: { in: notificationIds }
        },
        data: {
          isRead: true,
          updatedAt: new Date()
        }
      });

      // Clear cache for affected users
      const affectedNotifications = await prisma.notification.findMany({
        where: { id: { in: notificationIds } },
        select: { userId: true }
      });

      const userIds = [...new Set(affectedNotifications.map(n => n.userId))];
      await Promise.all(
        userIds.map(userId => this.clearUserNotificationCache(userId))
      );
    } catch (error) {
      console.error('Error marking notifications as read:', error);
      throw new Error('Failed to mark notifications as read');
    }
  }

  /**
   * Mark all notifications as read for a user
   */
  async markAllAsRead(userId: string): Promise<void> {
    try {
      await prisma.notification.updateMany({
        where: {
          userId,
          isRead: false
        },
        data: {
          isRead: true,
          updatedAt: new Date()
        }
      });

      await this.clearUserNotificationCache(userId);
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      throw new Error('Failed to mark all notifications as read');
    }
  }

  /**
   * Delete notifications
   */
  async deleteNotifications(notificationIds: string[]): Promise<void> {
    try {
      // Get affected users before deletion
      const affectedNotifications = await prisma.notification.findMany({
        where: { id: { in: notificationIds } },
        select: { userId: true }
      });

      await prisma.notification.deleteMany({
        where: { id: { in: notificationIds } }
      });

      // Clear cache for affected users
      const userIds = [...new Set(affectedNotifications.map(n => n.userId))];
      await Promise.all(
        userIds.map(userId => this.clearUserNotificationCache(userId))
      );
    } catch (error) {
      console.error('Error deleting notifications:', error);
      throw new Error('Failed to delete notifications');
    }
  }

  /**
   * Get notification statistics for a user
   */
  async getUserNotificationStats(userId: string): Promise<NotificationStats> {
    try {
      const [total, unread, byType, byPriority] = await Promise.all([
        prisma.notification.count({ where: { userId } }),
        prisma.notification.count({ where: { userId, isRead: false } }),
        prisma.notification.groupBy({
          by: ['type'],
          where: { userId },
          _count: { type: true }
        }),
        prisma.notification.groupBy({
          by: ['priority'],
          where: { userId },
          _count: { priority: true }
        })
      ]);

      const stats: NotificationStats = {
        total,
        unread,
        byType: byType.reduce((acc, item) => {
          acc[item.type as NotificationType] = item._count.type;
          return acc;
        }, {} as Record<NotificationType, number>),
        byPriority: byPriority.reduce((acc, item) => {
          acc[item.priority as NotificationPriority] = item._count.priority;
          return acc;
        }, {} as Record<NotificationPriority, number>)
      };

      return stats;
    } catch (error) {
      console.error('Error getting notification stats:', error);
      throw new Error('Failed to get notification stats');
    }
  }

  /**
   * Clean up old notifications (for maintenance)
   */
  async cleanupOldNotifications(daysOld: number = 30): Promise<number> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOld);

      const result = await prisma.notification.deleteMany({
        where: {
          createdAt: { lt: cutoffDate },
          isRead: true
        }
      });

      console.log(`Cleaned up ${result.count} old notifications`);
      return result.count;
    } catch (error) {
      console.error('Error cleaning up old notifications:', error);
      throw new Error('Failed to cleanup old notifications');
    }
  }

  // Private helper methods

  private async findSimilarNotification(data: CreateNotificationData): Promise<any> {
    const timeWindow = 5 * 60 * 1000; // 5 minutes
    const cutoffTime = new Date(Date.now() - timeWindow);

    return await prisma.notification.findFirst({
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
  }

  private async filterUsersWithSimilarNotifications(
    userIds: string[],
    type: NotificationType,
    actorId?: string,
    targetId?: string
  ): Promise<string[]> {
    const timeWindow = 5 * 60 * 1000; // 5 minutes
    const cutoffTime = new Date(Date.now() - timeWindow);

    const existingNotifications = await prisma.notification.findMany({
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
  }

  private async sendRealTimeNotification(notification: any): Promise<void> {
    try {
      if (io) {
        const formattedNotification = this.formatNotificationResponse(notification);
        io.to(notification.userId).emit('newNotification', formattedNotification);
        
        // Also emit unread count update
        const stats = await this.getUserNotificationStats(notification.userId);
        io.to(notification.userId).emit('notificationStatsUpdate', stats);
      }
    } catch (error) {
      console.error('Error sending real-time notification:', error);
    }
  }

  private async sendBatchRealTimeNotifications(userIds: string[], notificationData: any): Promise<void> {
    try {
      if (io) {
        userIds.forEach(userId => {
          io.to(userId).emit('newNotification', {
            ...notificationData,
            userId,
            id: 'temp-' + Date.now(), // Temporary ID for real-time display
            isRead: false,
            createdAt: new Date(),
            updatedAt: new Date()
          });
        });
      }
    } catch (error) {
      console.error('Error sending batch real-time notifications:', error);
    }
  }

  private async clearUserNotificationCache(userId: string): Promise<void> {
    try {
      // Since we don't have complex caching yet, just log
      console.log(`Clearing notification cache for user: ${userId}`);
    } catch (error) {
      console.error('Error clearing user notification cache:', error);
    }
  }

  private formatNotificationResponse(notification: any): NotificationResponse {
    return {
      id: notification.id,
      userId: notification.userId,
      actorId: notification.actorId,
      type: notification.type as NotificationType,
      title: notification.title,
      message: notification.message,
      targetId: notification.targetId,
      targetType: notification.targetType as TargetType,
      metadata: notification.metadata,
      isRead: notification.isRead,
      priority: notification.priority as NotificationPriority,
      createdAt: notification.createdAt,
      updatedAt: notification.updatedAt,
      actor: notification.actor
    };
  }
}

export default new NotificationService(); 