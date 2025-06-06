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
exports.getSharedPosts = exports.sharePost = void 0;
const client_1 = require("@prisma/client");
const ApiError_1 = require("../utils/ApiError");
const prisma = new client_1.PrismaClient();
const sharePost = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { postId } = req.params;
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
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
        // Create user activity record
        yield prisma.userActivity.create({
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
    }
    catch (error) {
        if (error instanceof ApiError_1.ApiError) {
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
});
exports.sharePost = sharePost;
const getSharedPosts = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
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
    }
    catch (error) {
        if (error instanceof ApiError_1.ApiError) {
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
});
exports.getSharedPosts = getSharedPosts;
