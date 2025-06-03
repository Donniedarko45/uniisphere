import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { ApiError } from '../utils/ApiError';

const prisma = new PrismaClient();

interface AuthenticatedRequest extends Request {
    user?: {
        id: string;
    };
}

export const sharePost = async (req: AuthenticatedRequest, res: Response):Promise<any> => {
    try {
        const { postId } = req.params;
        const userId = req.user?.id;

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

        // Create user activity record
        await prisma.userActivity.create({
            data: {
                userId,
                activityType: 'SHARE_POST',
                targetId: postId
            }
        });

        return res.status(201).json({
            success: true,
            message: 'Post shared successfully',
            data: share
        });
    } catch (error: any) {
        if (error instanceof ApiError) {
            return res.status(error.statusCode).json({
                success: false,
                message: error.message
            });
        }
        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

export const getSharedPosts = async (req: AuthenticatedRequest, res: Response):Promise<any> => {
    try {
        const userId = req.user?.id;

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
                        Share: true
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        return res.status(200).json({
            success: true,
            data: sharedPosts
        });
    } catch (error: any) {
        if (error instanceof ApiError) {
            return res.status(error.statusCode).json({
                success: false,
                message: error.message
            });
        }
        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};
