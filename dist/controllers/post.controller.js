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
exports.getUserPosts = exports.getPost = exports.deletePost = exports.updatePost = exports.createPost = void 0;
const prisma_1 = __importDefault(require("../config/prisma"));
const cloudinary_1 = __importDefault(require("../utils/cloudinary"));
const createPost = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { content, userId, visibility, tags, location } = req.body;
    try {
        let mediaUrl = "";
        if (req.file) {
            const result = yield cloudinary_1.default.uploader.upload(req.file.path, {
                folder: "posts",
                resource_type: "auto",
            });
            mediaUrl = result.secure_url;
        }
        const post = yield prisma_1.default.post.create({
            data: {
                content,
                mediaUrl,
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
        const { PostId } = req.params;
        yield prisma_1.default.post.delete({
            where: { id: PostId },
        });
        res.status(200).json({ message: "Post deleted Successfully" });
    }
    catch (error) {
        next(error);
    }
});
exports.deletePost = deletePost;
const getPost = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { PostId } = req.params;
    try {
        const post = yield prisma_1.default.post.findUnique({
            where: { id: PostId },
        });
        if (!post) {
            return res.status(404).json({ message: "post not found with this id" });
        }
        res.status(200).json(post);
    }
    catch (error) {
        next(error);
    }
});
exports.getPost = getPost;
const getUserPosts = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { UserId } = req.params;
    try {
        const posts = yield prisma_1.default.post.findMany({
            where: { id: UserId },
        });
        res.status(200).json({ posts });
    }
    catch (error) {
        next(error);
    }
});
exports.getUserPosts = getUserPosts;
