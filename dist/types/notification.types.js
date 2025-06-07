"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationTemplates = exports.TargetType = exports.NotificationPriority = exports.NotificationType = void 0;
var NotificationType;
(function (NotificationType) {
    // Post interactions
    NotificationType["POST_LIKE"] = "post_like";
    NotificationType["POST_COMMENT"] = "post_comment";
    NotificationType["POST_SHARE"] = "post_share";
    // Connection-related
    NotificationType["CONNECTION_REQUEST"] = "connection_request";
    NotificationType["CONNECTION_ACCEPTED"] = "connection_accepted";
    // Story interactions
    NotificationType["STORY_VIEW"] = "story_view";
    // Messages
    NotificationType["NEW_MESSAGE"] = "new_message";
    NotificationType["GROUP_MESSAGE"] = "group_message";
    // Blog interactions
    NotificationType["BLOG_LIKE"] = "blog_like";
    NotificationType["BLOG_COMMENT"] = "blog_comment";
    // Profile interactions
    NotificationType["PROFILE_VIEW"] = "profile_view";
    // System notifications
    NotificationType["WELCOME"] = "welcome";
    NotificationType["ACCOUNT_VERIFICATION"] = "account_verification";
    NotificationType["PASSWORD_CHANGED"] = "password_changed";
    NotificationType["WEEKLY_SUMMARY"] = "weekly_summary";
    // Human Library
    NotificationType["HUMAN_LIB_REQUEST"] = "human_lib_request";
    NotificationType["HUMAN_LIB_MATCHED"] = "human_lib_matched";
})(NotificationType || (exports.NotificationType = NotificationType = {}));
var NotificationPriority;
(function (NotificationPriority) {
    NotificationPriority["LOW"] = "low";
    NotificationPriority["NORMAL"] = "normal";
    NotificationPriority["HIGH"] = "high";
    NotificationPriority["URGENT"] = "urgent";
})(NotificationPriority || (exports.NotificationPriority = NotificationPriority = {}));
var TargetType;
(function (TargetType) {
    TargetType["USER"] = "user";
    TargetType["POST"] = "post";
    TargetType["COMMENT"] = "comment";
    TargetType["STORY"] = "story";
    TargetType["MESSAGE"] = "message";
    TargetType["BLOG"] = "blog";
    TargetType["CONNECTION"] = "connection";
})(TargetType || (exports.TargetType = TargetType = {}));
// Template configurations for different notification types
exports.NotificationTemplates = {
    [NotificationType.POST_LIKE]: {
        title: 'Post Liked',
        getMessage: (actorName) => `${actorName} liked your post`,
        priority: NotificationPriority.NORMAL
    },
    [NotificationType.POST_COMMENT]: {
        title: 'New Comment',
        getMessage: (actorName) => `${actorName} commented on your post`,
        priority: NotificationPriority.NORMAL
    },
    [NotificationType.POST_SHARE]: {
        title: 'Post Shared',
        getMessage: (actorName) => `${actorName} shared your post`,
        priority: NotificationPriority.NORMAL
    },
    [NotificationType.CONNECTION_REQUEST]: {
        title: 'Connection Request',
        getMessage: (actorName) => `${actorName} sent you a connection request`,
        priority: NotificationPriority.HIGH
    },
    [NotificationType.CONNECTION_ACCEPTED]: {
        title: 'Connection Accepted',
        getMessage: (actorName) => `${actorName} accepted your connection request`,
        priority: NotificationPriority.HIGH
    },
    [NotificationType.STORY_VIEW]: {
        title: 'Story View',
        getMessage: (actorName) => `${actorName} viewed your story`,
        priority: NotificationPriority.LOW
    },
    [NotificationType.NEW_MESSAGE]: {
        title: 'New Message',
        getMessage: (actorName) => `${actorName} sent you a message`,
        priority: NotificationPriority.HIGH
    },
    [NotificationType.GROUP_MESSAGE]: {
        title: 'Group Message',
        getMessage: (actorName) => `${actorName} sent a message in the group`,
        priority: NotificationPriority.NORMAL
    },
    [NotificationType.BLOG_LIKE]: {
        title: 'Blog Liked',
        getMessage: (actorName) => `${actorName} liked your blog post`,
        priority: NotificationPriority.NORMAL
    },
    [NotificationType.BLOG_COMMENT]: {
        title: 'Blog Comment',
        getMessage: (actorName) => `${actorName} commented on your blog`,
        priority: NotificationPriority.NORMAL
    },
    [NotificationType.PROFILE_VIEW]: {
        title: 'Profile View',
        getMessage: (actorName) => `${actorName} viewed your profile`,
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
        getMessage: (actorName) => `${actorName} wants to chat in Human Library`,
        priority: NotificationPriority.HIGH
    },
    [NotificationType.HUMAN_LIB_MATCHED]: {
        title: 'Human Library Match',
        getMessage: () => 'You have been matched for an anonymous chat!',
        priority: NotificationPriority.HIGH
    }
};
