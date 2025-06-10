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
exports.deleteBlog = exports.updateBlog = exports.createBlog = exports.getBlogById = exports.getAllBlogs = void 0;
const zod_1 = require("zod");
const cloudinary_1 = __importDefault(require("../utils/cloudinary"));
const prisma_1 = __importDefault(require("../config/prisma"));
//Maximum video duration in seconds (5 minutes)
const MAX_VIDEO_DURATION = 300;
// Maximum video size in bytes (100MB)
const MAX_VIDEO_SIZE = 50 * 1024 * 1024;
// Get all blogs
const getAllBlogs = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const blogs = yield prisma_1.default.blogs.findMany({
            orderBy: {
                createdAt: "desc",
            },
        });
        return res.status(200).json({
            success: true,
            data: blogs,
        });
    }
    catch (error) {
        next(error);
    }
});
exports.getAllBlogs = getAllBlogs;
// Get single blog by ID
const getBlogById = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const blog = yield prisma_1.default.blogs.findUnique({
            where: { id },
        });
        if (!blog) {
            return res.status(404).json({
                success: false,
                message: "Blog not found",
            });
        }
        return res.status(200).json({
            success: true,
            data: blog,
        });
    }
    catch (error) {
        next(error);
    }
});
exports.getBlogById = getBlogById;
// Create new blog with enhanced video handling
const createBlog = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { content, authorId, description, title } = req.body;
    try {
        const mediaUrls = [];
        if (!req.files || !Array.isArray(req.files)) {
            console.log("No files uploaded or invalid file format");
        }
        else {
            for (const file of req.files) {
                try {
                    if (!file.path) {
                        console.log(`No path found for file: ${file.originalname}`);
                        continue;
                    }
                    console.log("filePath:" + file.path);
                    const result = yield cloudinary_1.default.uploader.upload(file.path, {
                        folder: "posts",
                        resource_type: "auto",
                    });
                    console.log("result is ", result);
                    if (result && result.secure_url) {
                        mediaUrls.push(result.secure_url);
                    }
                    else {
                        console.log(`Failed to upload file: ${file.originalname}`);
                    }
                }
                catch (uploadError) {
                    console.error(`Error uploading file ${file.originalname}:`, uploadError);
                }
            }
        }
        const blog = yield prisma_1.default.blogs.create({
            data: {
                content,
                mediaUrl: mediaUrls,
                authorId,
                description,
                title,
            },
        });
        res.status(201).json({
            success: true,
            blog,
            mediaUrls,
            message: mediaUrls.length
                ? "blog created with media"
                : "blog created without media",
        });
    }
    catch (error) {
        console.error("Error in createBlog:", error);
        next(error);
    }
});
exports.createBlog = createBlog;
// Update blog
const updateBlog = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const existingBlog = yield prisma_1.default.blogs.findUnique({
            where: { id },
        });
        if (!existingBlog) {
            return res.status(404).json({
                success: false,
                message: "Blog not found",
            });
        }
        const updatedBlog = yield prisma_1.default.blogs.update({
            where: { id },
            //@ts-ignore
            data: validatedData,
        });
        return res.status(200).json({
            success: true,
            data: updatedBlog,
        });
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            return res.status(400).json({
                success: false,
                message: "Validation error",
                errors: error.errors,
            });
        }
        next(error);
    }
});
exports.updateBlog = updateBlog;
// Delete blog
const deleteBlog = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const existingBlog = yield prisma_1.default.blogs.findUnique({
            where: { id },
        });
        if (!existingBlog) {
            return res.status(404).json({
                success: false,
                message: "Blog not found",
            });
        }
        yield prisma_1.default.blogs.delete({
            where: { id },
        });
        return res.status(200).json({
            success: true,
            message: "Blog deleted successfully",
        });
    }
    catch (error) {
        next(error);
    }
});
exports.deleteBlog = deleteBlog;
