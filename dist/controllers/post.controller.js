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
exports.getTotalPosts = exports.unlikePost = exports.likePost = exports.createComment = exports.getUserPosts = exports.getPost = exports.deletePost = exports.updatePost = exports.createPost = void 0;
const prisma_1 = __importDefault(require("../config/prisma"));
const cloudinary_1 = __importDefault(require("../utils/cloudinary"));
const createPost = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { content, userId, visibility, tags, location } = req.body;
    try {
        const mediaUrls = []; // Changed variable name to be more clear
        // Handle multiple files
        if (req.files && Array.isArray(req.files)) {
            for (const file of req.files) {
                const result = yield cloudinary_1.default.uploader.upload(file.path, {
                    folder: "posts",
                    resource_type: "auto",
                });
                mediaUrls.push(result.secure_url);
            }
        }
        const post = yield prisma_1.default.post.create({
            data: {
                content,
                mediaUrl: mediaUrls, // Now matches the string[] type in schema
                userId,
                visibility,
                tags: tags ? tags.split(",") : [],
                location,
            },
        });
        res.status(201).json(post);
    }
    catch (error) {
        next(error);
    }
});
exports.createPost = createPost;
const updatePost = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { postId } = req.params;
        const { content, mediaUrl, visibility } = req.body;
        const post = yield prisma_1.default.post.update({
            where: { id: postId },
            data: { content, mediaUrl, visibility },
        });
        res.status(200).json(post);
    }
    catch (error) {
        next(error);
    }
});
exports.updatePost = updatePost;
const deletePost = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { postId } = req.params;
        const userId = req.userId;
        const post = yield prisma_1.default.post.findUnique({
            where: { id: postId },
        });
        if (!post) {
            return res.status(404).json({
                message: "Post not found"
            });
        }
        if (post.userId !== userId) {
            return res.status(403).json({
                message: "You don't have permission to delete this post"
            });
        }
        yield prisma_1.default.$transaction([
            prisma_1.default.likes.deleteMany({
                where: { postId }
            }),
            prisma_1.default.comments.deleteMany({
                where: { postId }
            }),
            prisma_1.default.share.deleteMany({
                where: { postId }
            }),
            // Finally delete the post
            prisma_1.default.post.delete({
                where: { id: postId }
            })
        ]);
        res.status(200).json({
            message: "Post and associated data deleted successfully"
        });
    }
    catch (error) {
        console.error("Error deleting post:", error);
        next(error);
    }
});
exports.deletePost = deletePost;
const getPost = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { postId } = req.params;
    try {
        const post = yield prisma_1.default.post.findUnique({
            where: { id: postId },
        });
        if (!post) {
            return res.status(404).json({ message: "Post not found" });
        }
        res.status(200).json(post);
    }
    catch (error) {
        next(error);
    }
});
exports.getPost = getPost;
const getUserPosts = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { userId } = req.params;
    try {
        const posts = yield prisma_1.default.post.findMany({
            where: { userId },
        });
        res.status(200).json({ posts });
    }
    catch (error) {
        next(error);
    }
});
exports.getUserPosts = getUserPosts;
const createComment = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { postId } = req.params;
        const { content } = req.body;
        const userId = req.userId;
        const comment = yield prisma_1.default.comments.create({
            data: {
                content,
                userId,
                postId,
            },
            include: {
                user: {
                    select: {
                        username: true,
                        profilePictureUrl: true,
                    },
                },
            },
        });
        res.status(201).json(comment);
    }
    catch (error) {
        next(error);
    }
});
exports.createComment = createComment;
const likePost = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { postId } = req.params;
        const userId = req.userId;
        const like = yield prisma_1.default.likes.create({
            data: {
                userId,
                postId,
            },
        });
        res.status(201).json(like);
    }
    catch (error) {
        next(error);
    }
});
exports.likePost = likePost;
const unlikePost = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { postId } = req.params;
        const userId = req.userId;
        yield prisma_1.default.likes.delete({
            where: {
                userId_postId: {
                    userId,
                    postId,
                },
            },
        });
        res.status(200).json({ message: "Post unliked successfully" });
    }
    catch (error) {
        next(error);
    }
});
exports.unlikePost = unlikePost;
const getTotalPosts = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = req.userId;
        const totalPosts = yield prisma_1.default.post.findMany({
            where: {
                userId,
            },
            select: {
                content: true,
                mediaUrl: true,
                user: true,
                _count: {
                    select: {
                        Likes: true,
                        Comments: true,
                    },
                },
            },
        });
        res.status(200).json({ totalPosts });
    }
    catch (error) {
        next(error);
    }
});
exports.getTotalPosts = getTotalPosts;
