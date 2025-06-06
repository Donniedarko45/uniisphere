# 🔔 Notification System Integration Guide

## Overview
The notification system is now ready! Here's how to integrate it into your existing controllers.

## Quick Integration Examples

### 1. **Post Controller Integration**

In your `post.controller.ts`, add these imports and integrate notifications:

```typescript
import { notifyPostLike, notifyPostComment, notifyPostShare } from '../utils/notificationHelpers';

// In your like post method
export const likePost = async (req: Request, res: Response) => {
  try {
    const { postId } = req.params;
    const userId = req.userId; // From auth middleware
    
    // Your existing like logic here...
    const like = await prisma.likes.create({
      data: { postId, userId }
    });
    
    // 🔔 Add notification
    await notifyPostLike(postId, userId);
    
    res.status(200).json({ message: 'Post liked successfully' });
  } catch (error) {
    // Error handling...
  }
};

// In your comment method
export const commentOnPost = async (req: Request, res: Response) => {
  try {
    const { postId } = req.params;
    const { content } = req.body;
    const userId = req.userId;
    
    // Your existing comment logic...
    const comment = await prisma.comments.create({
      data: { postId, userId, content }
    });
    
    // 🔔 Add notification
    await notifyPostComment(postId, userId, content);
    
    res.status(201).json({ comment });
  } catch (error) {
    // Error handling...
  }
};
```

### 2. **Connection Controller Integration**

In your `connection.controller.ts`:

```typescript
import { notifyConnectionRequest, notifyConnectionAccepted } from '../utils/notificationHelpers';

// In your send connection request method
export const sendConnectionRequest = async (req: Request, res: Response) => {
  try {
    const { toUserId } = req.body;
    const fromUserId = req.userId;
    
    // Your existing connection logic...
    const connection = await prisma.connection.create({
      data: { userId1: fromUserId, userId2: toUserId, status: 'pending' }
    });
    
    // 🔔 Add notification
    await notifyConnectionRequest(fromUserId, toUserId);
    
    res.status(201).json({ message: 'Connection request sent' });
  } catch (error) {
    // Error handling...
  }
};

// In your accept connection method
export const acceptConnection = async (req: Request, res: Response) => {
  try {
    const { connectionId } = req.params;
    const userId = req.userId;
    
    // Your existing accept logic...
    const connection = await prisma.connection.update({
      where: { id: connectionId },
      data: { status: 'accepted' }
    });
    
    // Find the requestor ID
    const requestorId = connection.userId1 === userId ? connection.userId2 : connection.userId1;
    
    // 🔔 Add notification
    await notifyConnectionAccepted(userId, requestorId);
    
    res.status(200).json({ message: 'Connection accepted' });
  } catch (error) {
    // Error handling...
  }
};
```

### 3. **Message Controller Integration**

In your `message.controller.ts`:

```typescript
import { notifyNewMessage } from '../utils/notificationHelpers';

export const sendMessage = async (req: Request, res: Response) => {
  try {
    const { receiverId, content } = req.body;
    const senderId = req.userId;
    
    // Your existing message logic...
    const message = await prisma.message.create({
      data: { senderId, receiverId, content }
    });
    
    // 🔔 Add notification
    await notifyNewMessage(senderId, receiverId, content);
    
    res.status(201).json({ message });
  } catch (error) {
    // Error handling...
  }
};
```

### 4. **Auth Controller Integration**

In your `auth.controller.ts`:

```typescript
import { notifyWelcomeUser, notifyAccountVerification } from '../utils/notificationHelpers';

export const register = async (req: Request, res: Response) => {
  try {
    // Your existing registration logic...
    const user = await prisma.user.create({
      data: { email, passwordHash, firstName, lastName }
    });
    
    // 🔔 Send welcome notification
    await notifyWelcomeUser(user.id);
    
    res.status(201).json({ message: 'User registered successfully' });
  } catch (error) {
    // Error handling...
  }
};

export const verifyOtp = async (req: Request, res: Response) => {
  try {
    // Your existing OTP verification logic...
    await prisma.user.update({
      where: { id: userId },
      data: { verified: true }
    });
    
    // 🔔 Send verification notification
    await notifyAccountVerification(userId);
    
    res.status(200).json({ message: 'Account verified successfully' });
  } catch (error) {
    // Error handling...
  }
};
```

### 5. **Story Controller Integration**

In your `story.controller.ts`:

```typescript
import { notifyStoryView } from '../utils/notificationHelpers';

export const viewStory = async (req: Request, res: Response) => {
  try {
    const { storyId } = req.params;
    const viewerId = req.userId;
    
    // Your existing story view logic...
    const storyView = await prisma.storyView.create({
      data: { storyId, viewerId }
    });
    
    // 🔔 Add notification (optional - only for close friends)
    await notifyStoryView(storyId, viewerId);
    
    res.status(200).json({ message: 'Story viewed' });
  } catch (error) {
    // Error handling...
  }
};
```

## API Endpoints

### Frontend Integration

The notification system provides these endpoints for your frontend:

```typescript
// Get user notifications (with pagination and filters)
GET /api/notifications?page=1&limit=20&isRead=false

// Get notification statistics (unread count, etc.)
GET /api/notifications/stats

// Mark specific notifications as read
PATCH /api/notifications/read
Body: { notificationIds: ["id1", "id2"] }

// Mark all notifications as read
PATCH /api/notifications/read-all

// Delete notifications
DELETE /api/notifications
Body: { notificationIds: ["id1", "id2"] }

// Get notification metadata (types, priorities)
GET /api/notifications/metadata

// Create test notification (development only)
POST /api/notifications/test
```

## Real-Time Integration

### Frontend Socket.io Setup

```typescript
// In your frontend
import io from 'socket.io-client';

const socket = io('your-backend-url');

// Join user's personal room
socket.emit('join', userId);

// Listen for new notifications
socket.on('newNotification', (notification) => {
  // Update your notification UI
  updateNotificationUI(notification);
  showNotificationToast(notification);
});

// Listen for stats updates
socket.on('notificationStatsUpdate', (stats) => {
  // Update unread count badge
  updateUnreadCount(stats.unread);
});
```

## Database Migration

Don't forget to run the database migration:

```bash
npx prisma migrate dev --name add-notifications
npx prisma generate
```

## Best Practices

1. **Always wrap notification calls in try-catch** - Don't let notification failures break your main functionality
2. **Use appropriate priorities** - HIGH for important actions (connections, messages), LOW for views
3. **Avoid notification spam** - The system already includes deduplication logic
4. **Test real-time features** - Make sure Socket.io is properly configured
5. **Monitor performance** - Batch notifications for mass actions

## Optional: Notification Preferences

You can extend the User model to include notification preferences:

```prisma
model User {
  // ... existing fields
  notificationPreferences Json? @default("{}")
}
```

Then modify helpers to check preferences before sending notifications.

## Testing

Use the test endpoint to verify everything works:

```bash
# After authentication
POST /api/notifications/test
Authorization: Bearer your-jwt-token
```

This will create a test notification and trigger real-time updates.

## Performance Considerations

- Notifications are cached in Redis for better performance
- Batch operations are used for multiple users
- Database queries are optimized with proper indexing
- Cleanup job removes old read notifications

Your notification system is now production-ready! 🚀 