import { Request, Response } from 'express';
import notificationService from '../services/notificationService';
import { NotificationFilters, NotificationType, NotificationPriority } from '../types/notification.types';

interface AuthenticatedRequest extends Request {
  userId?: string;
}

class NotificationController {
  
  /**
   * Get user's notifications with pagination and filtering
   * GET /api/notifications
   */
  async getNotifications(req: AuthenticatedRequest, res: Response): Promise<any> {
    try {
      const userId = req.userId;
      if (!userId) {
        return res.status(401).json({ 
          success: false, 
          message: 'User not authenticated' 
        });
      }

      const {
        page = '1',
        limit = '20',
        isRead,
        type,
        priority,
        fromDate,
        toDate,
        actorId
      } = req.query;

      // Build filters
      const filters: NotificationFilters = {};
      
      if (isRead !== undefined) {
        filters.isRead = isRead === 'true';
      }
      
      if (type) {
        if (Array.isArray(type)) {
          filters.type = type as NotificationType[];
        } else {
          filters.type = type as NotificationType;
        }
      }
      
      if (priority) {
        if (Array.isArray(priority)) {
          filters.priority = priority as NotificationPriority[];
        } else {
          filters.priority = priority as NotificationPriority;
        }
      }
      
      if (fromDate) {
        filters.fromDate = new Date(fromDate as string);
      }
      
      if (toDate) {
        filters.toDate = new Date(toDate as string);
      }
      
      if (actorId) {
        filters.actorId = actorId as string;
      }

      const result = await notificationService.getUserNotifications(
        userId,
        parseInt(page as string),
        parseInt(limit as string),
        filters
      );

      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      console.error('Error getting notifications:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get notifications'
      });
    }
  }

  /**
   * Get notification statistics
   * GET /api/notifications/stats
   */
  async getNotificationStats(req: AuthenticatedRequest, res: Response): Promise<any> {
    try { 
      const userId = req.userId;
      if (!userId) {
        return res.status(401).json({ 
          success: false, 
          message: 'User not authenticated' 
        });
      }

      const stats = await notificationService.getUserNotificationStats(userId);

      res.status(200).json({
        success: true,
        data: stats
      });
    } catch (error) {
      console.error('Error getting notification stats:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get notification statistics'
      });
    }
  }

  /**
   * Mark specific notifications as read
   * PATCH /api/notifications/read
   */
  async markAsRead(req: AuthenticatedRequest, res: Response): Promise<any> {
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

      await notificationService.markAsRead(notificationIds);

      // Get updated stats
      const stats = await notificationService.getUserNotificationStats(userId);

      res.status(200).json({
        success: true,
        message: 'Notifications marked as read',
        data: { stats }
      });
    } catch (error) {
      console.error('Error marking notifications as read:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to mark notifications as read'
      });
    }
  }

  /**
   * Mark all notifications as read
   * PATCH /api/notifications/read-all
   */
  async markAllAsRead(req: AuthenticatedRequest, res: Response): Promise<any> {
    try {
      const userId = req.userId;
      if (!userId) {
        return res.status(401).json({ 
          success: false, 
          message: 'User not authenticated' 
        });
      }

      await notificationService.markAllAsRead(userId);

      // Get updated stats
      const stats = await notificationService.getUserNotificationStats(userId);

      res.status(200).json({
        success: true,
        message: 'All notifications marked as read',
        data: { stats }
      });
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to mark all notifications as read'
      });
    }
  }

  /**
   * Delete specific notifications
   * DELETE /api/notifications
   */
  async deleteNotifications(req: AuthenticatedRequest, res: Response): Promise<any> {
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

      await notificationService.deleteNotifications(notificationIds);

      // Get updated stats
      const stats = await notificationService.getUserNotificationStats(userId);

      res.status(200).json({
        success: true,
        message: 'Notifications deleted successfully',
        data: { stats }
      });
    } catch (error) {
      console.error('Error deleting notifications:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete notifications'
      });
    }
  }

  /**
   * Test endpoint to create a sample notification (for development)
   * POST /api/notifications/test
   */
  async createTestNotification(req: AuthenticatedRequest, res: Response): Promise<any> {
    try {
      const userId = req.userId;
      if (!userId) {
        return res.status(401).json({ 
          success: false, 
          message: 'User not authenticated' 
        });
      }

      const notification = await notificationService.createNotification({
        userId,
        type: NotificationType.WELCOME,
        title: 'Test Notification',
        message: 'This is a test notification created for development purposes.',
        priority: NotificationPriority.NORMAL
      });

      res.status(201).json({
        success: true,
        message: 'Test notification created',
        data: notification
      });
    } catch (error) {
      console.error('Error creating test notification:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create test notification'
      });
    }
  }

  /**
   * Get notification types and priorities (for frontend dropdowns)
   * GET /api/notifications/metadata
   */
  async getNotificationMetadata(req: Request, res: Response): Promise<any> {
    try {
      const types = Object.values(NotificationType);
      const priorities = Object.values(NotificationPriority);

      res.status(200).json({
        success: true,
        data: {
          types,
          priorities
        }
      });
    } catch (error) {
      console.error('Error getting notification metadata:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get notification metadata'
      });
    }
  }
}

export default new NotificationController(); 