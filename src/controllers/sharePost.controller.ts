import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { ApiError } from '../utils/ApiError';
import { io } from '../utils/socket';

const prisma = new PrismaClient();

interface AuthenticatedRequest extends Request {
    userId?: string;
}

export const sharePost = async (req: AuthenticatedRequest, res: Response):Promise<any> => {
    try {
        const { postId } = req.params;
        const { message } = req.body; // Extract message from request body
        const userId = req.userId;

        if (!userId) {
            throw new ApiError(401, 'Unauthorized - User not authenticated');
        }

        // Check if post exists
        const post = await prisma.post.findUnique({
            where: { id: postId },
            include: {
                user: {
                    select: {
                        id: true,
                        username: true,
                        profilePictureUrl: true
                    }
                }
            }
        }); 

        if (!post) {
            throw new ApiError(404, 'Post not found');
        }

        // Check if user has already shared this post
        const existingShare = await prisma.share.findFirst({
            where: {
                userId,
                postId
            }
        });

        if (existingShare) {
            return res.status(400).json({
                success: false,
                message: 'You have already shared this post'
            });
        }

        // Create share record
        const share = await prisma.share.create({
            data: {
                userId,
                postId
            },
            include: {
                post: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                username: true,
                                profilePictureUrl: true
                            }
                        }
                    }
                }
            }
        });

        // Create user activity record with optional message
        await prisma.userActivity.create({
            data: {
                userId,
                activityType: 'SHARE_POST',
                targetId: postId
                // Note: If you want to store the message, you can add it to metadata field
                // metadata: message ? { message } : undefined
            }
        });

        // Extract @username mentions from the message and send to those users
        let messagesSent = 0;
        if (message && message.includes('@')) {
            const mentionRegex = /@(\w+)/g;
            const mentions = message.match(mentionRegex);
            
            if (mentions) {
                const usernames = mentions.map((mention: string) => mention.substring(1)); // Remove @ symbol
                
                // Find mentioned users
                const mentionedUsers = await prisma.user.findMany({
                    where: {
                        username: {
                            in: usernames
                        }
                    },
                    select: {
                        id: true,
                        username: true,
                        profilePictureUrl: true
                    }
                });

                // Send messages to mentioned users
                for (const mentionedUser of mentionedUsers) {
                    try {
                        // Check if users are connected
                        const connection = await prisma.connection.findFirst({
                            where: {
                                OR: [
                                    { userId1: userId, userId2: mentionedUser.id, status: "accepted" },
                                    { userId1: mentionedUser.id, userId2: userId, status: "accepted" },
                                ],
                            },
                        });

                        if (connection) {
                            // Create shared post message content
                            const shareMessageContent = `📤 Shared a post: "${post.content?.substring(0, 100)}${post.content && post.content.length > 100 ? '...' : ''}" \n\n${message}`;
                            
                            // Send message
                            const sentMessage = await prisma.message.create({
                                data: {
                                    senderId: userId,
                                    receiverId: mentionedUser.id,
                                    content: shareMessageContent,
                                },
                                include: {
                                    sender: {
                                        select: {
                                            id: true,
                                            username: true,
                                            profilePictureUrl: true,
                                        },
                                    },
                                    receiver: {
                                        select: {
                                            id: true,
                                            username: true,
                                            profilePictureUrl: true,
                                        },
                                    },
                                },
                            });

                            // Emit real-time message if socket is available
                            if (io && io.to) {
                                io.to(mentionedUser.id).emit("newMessage", sentMessage);
                            }

                            messagesSent++;
                        }
                    } catch (messageError) {
                        console.error(`Error sending message to ${mentionedUser.username}:`, messageError);
                    }
                }
            }
        }

        // Get updated share count
        const shareCount = await prisma.share.count({
            where: { postId }
        });

        return res.status(201).json({
            success: true,
            message: messagesSent > 0 
                ? `Post shared successfully and sent to ${messagesSent} user(s)`
                : 'Post shared successfully',
            data: {
                ...share,
                shareCount,
                messagesSent
            }
        });
    } catch (error: any) {
        console.error('Share post error:', error);
        
        if (error instanceof ApiError) {
            return res.status(error.statusCode).json({
                success: false,
                message: error.message
            });
        }
        
        // Handle unique constraint violations (duplicate shares)
        if (error.code === 'P2002') {
            return res.status(400).json({
                success: false,
                message: 'You have already shared this post'
            });
        }
        
        return res.status(500).json({
            success: false,
            message: 'Internal server error',
            ...(process.env.NODE_ENV === 'development' && { error: error.message })
        });
    }
};

export const getSharedPosts = async (req: AuthenticatedRequest, res: Response):Promise<any> => {
    try {
        const userId = req.userId;

        if (!userId) {
            throw new ApiError(401, 'Unauthorized - User not authenticated');
        }

        const sharedPosts = await prisma.share.findMany({
            where: {
                userId
            },
            include: {
                post: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                username: true,
                                profilePictureUrl: true
                            }
                        },
                        Likes: true,
                        Comments: true,
                        Share: true,
                        _count: {
                            select: {
                                Likes: true,
                                Comments: true,
                                Share: true
                            }
                        }
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        return res.status(200).json({
            success: true,
            count: sharedPosts.length,
            data: sharedPosts
        });
    } catch (error: any) {
        console.error('Get shared posts error:', error);
        
        if (error instanceof ApiError) {
            return res.status(error.statusCode).json({
                success: false,
                message: error.message
            });
        }
        return res.status(500).json({
            success: false,
            message: 'Internal server error',
            ...(process.env.NODE_ENV === 'development' && { error: error.message })
        });
    }
};

export const unsharePost = async (req: AuthenticatedRequest, res: Response):Promise<any> => {
    try {
        const { postId } = req.params;
        const userId = req.userId;

        if (!userId) {
            throw new ApiError(401, 'Unauthorized - User not authenticated');
        }

        // Check if the share exists
        const existingShare = await prisma.share.findFirst({
            where: {
                userId,
                postId
            }
        });

        if (!existingShare) {
            return res.status(404).json({
                success: false,
                message: 'Share not found or you have not shared this post'
            });
        }

        // Delete the share record
        await prisma.share.delete({
            where: {
                id: existingShare.id
            }
        });

        // Get updated share count
        const shareCount = await prisma.share.count({
            where: { postId }
        });

        return res.status(200).json({
            success: true,
            message: 'Post unshared successfully',
            data: {
                shareCount
            }
        });
    } catch (error: any) {
        console.error('Unshare post error:', error);
        
        if (error instanceof ApiError) {
            return res.status(error.statusCode).json({
                success: false,
                message: error.message
            });
        }
        return res.status(500).json({
            success: false,
            message: 'Internal server error',
            ...(process.env.NODE_ENV === 'development' && { error: error.message })
        });
    }
};
