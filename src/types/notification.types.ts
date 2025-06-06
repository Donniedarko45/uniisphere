export enum NotificationType {
  // Post interactions
  POST_LIKE = 'post_like',
  POST_COMMENT = 'post_comment',
  POST_SHARE = 'post_share',
  
  // Connection-related
  CONNECTION_REQUEST = 'connection_request',
  CONNECTION_ACCEPTED = 'connection_accepted',
  
  // Story interactions
  STORY_VIEW = 'story_view',
  
  // Messages
  NEW_MESSAGE = 'new_message',
  GROUP_MESSAGE = 'group_message',
  
  // Blog interactions
  BLOG_LIKE = 'blog_like',
  BLOG_COMMENT = 'blog_comment',
  
  // Profile interactions
  PROFILE_VIEW = 'profile_view',
  
  // System notifications
  WELCOME = 'welcome',
  ACCOUNT_VERIFICATION = 'account_verification',
  PASSWORD_CHANGED = 'password_changed',
  WEEKLY_SUMMARY = 'weekly_summary',
  
  // Human Library
  HUMAN_LIB_REQUEST = 'human_lib_request',
  HUMAN_LIB_MATCHED = 'human_lib_matched',
}

export enum NotificationPriority {
  LOW = 'low',
  NORMAL = 'normal',
  HIGH = 'high',
  URGENT = 'urgent'
}

export enum TargetType {
  USER = 'user',
  POST = 'post',
  COMMENT = 'comment',
  STORY = 'story',
  MESSAGE = 'message',
  BLOG = 'blog',
  CONNECTION = 'connection'
}

export interface NotificationMetadata {
  postContent?: string;
  imageUrl?: string;
  actionUrl?: string;
  additionalData?: Record<string, any>;
  [key: string]: any; // Index signature for Prisma Json compatibility
}

export interface CreateNotificationData {
  userId: string;
  actorId?: string;
  type: NotificationType;
  title: string;
  message: string;
  targetId?: string;
  targetType?: TargetType;
  metadata?: NotificationMetadata;
  priority?: NotificationPriority;
}

export interface NotificationResponse {
  id: string;
  userId: string;
  actorId?: string;
  type: NotificationType;
  title: string;
  message: string;
  targetId?: string;
  targetType?: TargetType;
  metadata?: NotificationMetadata;
  isRead: boolean;
  priority: NotificationPriority;
  createdAt: Date;
  updatedAt: Date;
  actor?: {
    id: string;
    username: string;
    firstName?: string;
    lastName?: string;
    profilePictureUrl?: string;
  };
}

export interface NotificationPreferences {
  postLikes: boolean;
  comments: boolean;
  connectionRequests: boolean;
  messages: boolean;
  storyViews: boolean;
  blogInteractions: boolean;
  systemNotifications: boolean;
  emailNotifications: boolean;
  pushNotifications: boolean;
}

export interface NotificationStats {
  total: number;
  unread: number;
  byType: Record<NotificationType, number>;
  byPriority: Record<NotificationPriority, number>;
}

export interface NotificationFilters {
  isRead?: boolean;
  type?: NotificationType | NotificationType[];
  priority?: NotificationPriority | NotificationPriority[];
  fromDate?: Date;
  toDate?: Date;
  actorId?: string;
}

export interface PaginatedNotifications {
  notifications: NotificationResponse[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
  stats: NotificationStats;
}

// Template configurations for different notification types
export const NotificationTemplates = {
  [NotificationType.POST_LIKE]: {
    title: 'Post Liked',
    getMessage: (actorName: string) => `${actorName} liked your post`,
    priority: NotificationPriority.NORMAL
  },
  [NotificationType.POST_COMMENT]: {
    title: 'New Comment',
    getMessage: (actorName: string) => `${actorName} commented on your post`,
    priority: NotificationPriority.NORMAL
  },
  [NotificationType.POST_SHARE]: {
    title: 'Post Shared',
    getMessage: (actorName: string) => `${actorName} shared your post`,
    priority: NotificationPriority.NORMAL
  },
  [NotificationType.CONNECTION_REQUEST]: {
    title: 'Connection Request',
    getMessage: (actorName: string) => `${actorName} sent you a connection request`,
    priority: NotificationPriority.HIGH
  },
  [NotificationType.CONNECTION_ACCEPTED]: {
    title: 'Connection Accepted',
    getMessage: (actorName: string) => `${actorName} accepted your connection request`,
    priority: NotificationPriority.HIGH
  },
  [NotificationType.STORY_VIEW]: {
    title: 'Story View',
    getMessage: (actorName: string) => `${actorName} viewed your story`,
    priority: NotificationPriority.LOW
  },
  [NotificationType.NEW_MESSAGE]: {
    title: 'New Message',
    getMessage: (actorName: string) => `${actorName} sent you a message`,
    priority: NotificationPriority.HIGH
  },
  [NotificationType.GROUP_MESSAGE]: {
    title: 'Group Message',
    getMessage: (actorName: string) => `${actorName} sent a message in the group`,
    priority: NotificationPriority.NORMAL
  },
  [NotificationType.BLOG_LIKE]: {
    title: 'Blog Liked',
    getMessage: (actorName: string) => `${actorName} liked your blog post`,
    priority: NotificationPriority.NORMAL
  },
  [NotificationType.BLOG_COMMENT]: {
    title: 'Blog Comment',
    getMessage: (actorName: string) => `${actorName} commented on your blog`,
    priority: NotificationPriority.NORMAL
  },
  [NotificationType.PROFILE_VIEW]: {
    title: 'Profile View',
    getMessage: (actorName: string) => `${actorName} viewed your profile`,
    priority: NotificationPriority.LOW
  },
  [NotificationType.WELCOME]: {
    title: 'Welcome to Uniisphere!',
    getMessage: () => 'Welcome to Uniisphere! Complete your profile to get started.',
    priority: NotificationPriority.NORMAL
  },
  [NotificationType.ACCOUNT_VERIFICATION]: {
    title: 'Account Verified',
    getMessage: () => 'Your account has been successfully verified!',
    priority: NotificationPriority.HIGH
  },
  [NotificationType.PASSWORD_CHANGED]: {
    title: 'Password Changed',
    getMessage: () => 'Your password has been successfully changed.',
    priority: NotificationPriority.HIGH
  },
  [NotificationType.WEEKLY_SUMMARY]: {
    title: 'Weekly Summary',
    getMessage: () => 'Check out your weekly activity summary!',
    priority: NotificationPriority.LOW
  },
  [NotificationType.HUMAN_LIB_REQUEST]: {
    title: 'Human Library Request',
    getMessage: (actorName: string) => `${actorName} wants to chat in Human Library`,
    priority: NotificationPriority.HIGH
  },
  [NotificationType.HUMAN_LIB_MATCHED]: {
    title: 'Human Library Match',
    getMessage: () => 'You have been matched for an anonymous chat!',
    priority: NotificationPriority.HIGH
  }
}; 