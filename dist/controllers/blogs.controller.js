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
exports.deleteBlog = exports.updateBlog = exports.createBlog = exports.getBlogById = exports.getAllBlogs = void 0;
const client_1 = require("@prisma/client");
const zod_1 = require("zod");
const prisma = new client_1.PrismaClient();
// Validation schema for blog creation and updates
const blogSchema = zod_1.z.object({
    title: zod_1.z.string().min(1, "Title is required"),
    description: zod_1.z.string().optional(),
    content: zod_1.z.string().min(1, "Content is required"),
    titlePhoto: zod_1.z.string().optional(),
    contentVideo: zod_1.z.array(zod_1.z.string()).optional(),
    mediaUrl: zod_1.z.array(zod_1.z.string()).optional(),
    authorId: zod_1.z.string().min(1, "Author ID is required"),
    tags: zod_1.z.array(zod_1.z.string()).optional(),
    published: zod_1.z.boolean().optional()
});
// Get all blogs
const getAllBlogs = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const blogs = yield prisma.blogs.findMany({
            orderBy: {
                createdAt: 'desc'
            }
        });
        return res.status(200).json({
            success: true,
            data: blogs
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
        const blog = yield prisma.blogs.findUnique({
            where: { id }
        });
        if (!blog) {
            return res.status(404).json({
                success: false,
                message: "Blog not found"
            });
        }
        return res.status(200).json({
            success: true,
            data: blog
        });
    }
    catch (error) {
        next(error);
    }
});
exports.getBlogById = getBlogById;
// Create new blog
const createBlog = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const validatedData = blogSchema.parse(req.body);
        const blog = yield prisma.blogs.create({
            data: Object.assign(Object.assign({}, validatedData), { published: (_a = validatedData.published) !== null && _a !== void 0 ? _a : false }),
            include: {
                author: true
            }
        });
        return res.status(201).json({
            success: true,
            data: blog
        });
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            return res.status(400).json({
                success: false,
                message: "Validation error",
                errors: error.errors
            });
        }
        next(error);
    }
});
exports.createBlog = createBlog;
// Update blog
const updateBlog = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const validatedData = blogSchema.partial().parse(req.body);
        const existingBlog = yield prisma.blogs.findUnique({
            where: { id }
        });
        if (!existingBlog) {
            return res.status(404).json({
                success: false,
                message: "Blog not found"
            });
        }
        const updatedBlog = yield prisma.blogs.update({
            where: { id },
            data: validatedData
        });
        return res.status(200).json({
            success: true,
            data: updatedBlog
        });
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            return res.status(400).json({
                success: false,
                message: "Validation error",
                errors: error.errors
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
        const existingBlog = yield prisma.blogs.findUnique({
            where: { id }
        });
        if (!existingBlog) {
            return res.status(404).json({
                success: false,
                message: "Blog not found"
            });
        }
        yield prisma.blogs.delete({
            where: { id }
        });
        return res.status(200).json({
            success: true,
            message: "Blog deleted successfully"
        });
    }
    catch (error) {
        next(error);
    }
});
exports.deleteBlog = deleteBlog;
