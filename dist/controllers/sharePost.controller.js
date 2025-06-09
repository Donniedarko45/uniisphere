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
Object.defineProperty(exports, "__esModule", { value: true });
exports.unsharePost = exports.getSharedPosts = exports.sharePost = void 0;
const client_1 = require("@prisma/client");
const ApiError_1 = require("../utils/ApiError");
const prisma = new client_1.PrismaClient();
const sharePost = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { postId } = req.params;
        const { message } = req.body; // Extract message from request body
        const userId = req.userId;
        if (!userId) {
            throw new ApiError_1.ApiError(401, 'Unauthorized - User not authenticated');
        }
        // Check if post exists
        const post = yield prisma.post.findUnique({
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
            throw new ApiError_1.ApiError(404, 'Post not found');
        }
        // Check if user has already shared this post
        const existingShare = yield prisma.share.findFirst({
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
        const share = yield prisma.share.create({
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
        yield prisma.userActivity.create({
            data: {
                userId,
                activityType: 'SHARE_POST',
                targetId: postId
                // Note: If you want to store the message, you can add it to metadata field
                // metadata: message ? { message } : undefined
            }
        });
        // Get updated share count
        const shareCount = yield prisma.share.count({
            where: { postId }
        });
        return res.status(201).json({
            success: true,
            message: 'Post shared successfully',
            data: Object.assign(Object.assign({}, share), { shareCount })
        });
    }
    catch (error) {
        console.error('Share post error:', error);
        if (error instanceof ApiError_1.ApiError) {
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
        return res.status(500).json(Object.assign({ success: false, message: 'Internal server error' }, (process.env.NODE_ENV === 'development' && { error: error.message })));
    }
});
exports.sharePost = sharePost;
const getSharedPosts = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = req.userId;
        if (!userId) {
            throw new ApiError_1.ApiError(401, 'Unauthorized - User not authenticated');
        }
        const sharedPosts = yield prisma.share.findMany({
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
    }
    catch (error) {
        console.error('Get shared posts error:', error);
        if (error instanceof ApiError_1.ApiError) {
            return res.status(error.statusCode).json({
                success: false,
                message: error.message
            });
        }
        return res.status(500).json(Object.assign({ success: false, message: 'Internal server error' }, (process.env.NODE_ENV === 'development' && { error: error.message })));
    }
});
exports.getSharedPosts = getSharedPosts;
const unsharePost = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { postId } = req.params;
        const userId = req.userId;
        if (!userId) {
            throw new ApiError_1.ApiError(401, 'Unauthorized - User not authenticated');
        }
        // Check if the share exists
        const existingShare = yield prisma.share.findFirst({
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
        yield prisma.share.delete({
            where: {
                id: existingShare.id
            }
        });
        // Get updated share count
        const shareCount = yield prisma.share.count({
            where: { postId }
        });
        return res.status(200).json({
            success: true,
            message: 'Post unshared successfully',
            data: {
                shareCount
            }
        });
    }
    catch (error) {
        console.error('Unshare post error:', error);
        if (error instanceof ApiError_1.ApiError) {
            return res.status(error.statusCode).json({
                success: false,
                message: error.message
            });
        }
        return res.status(500).json(Object.assign({ success: false, message: 'Internal server error' }, (process.env.NODE_ENV === 'development' && { error: error.message })));
    }
});
exports.unsharePost = unsharePost;
