"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const blogs_controller_1 = require("../controllers/blogs.controller");
const rateLimiter_middleware_1 = require("../middlewares/rateLimiter.middleware");
const auth_middleware_1 = require("../middlewares/auth.middleware");
//import { blogMediaUpload } from '../middlewares/upload.middleware';
const upload_middleware_1 = require("../middlewares/upload.middleware");
const router = (0, express_1.Router)();
router.get("/allBlogs", blogs_controller_1.getAllBlogs);
router.get("/blog/:id", blogs_controller_1.getBlogById);
router.post("/create", auth_middleware_1.authenticate, auth_middleware_1.verifyUser, rateLimiter_middleware_1.postLimiter, rateLimiter_middleware_1.uploadLimiter, upload_middleware_1.storyUpload.array("media", 2), blogs_controller_1.createBlog);
// Support multiple file uploads for create endpoint
//router.post('/create', authenticate, blogMediaUpload.array('files', 10), createBlog);
// Legacy route with single file upload (keeping for compatibility)
//router.post('/blog/create', authenticate, blogMediaUpload.array('files', 10), createBlog);
// Support multiple file uploads for both images and videos
//router.put('/blogs/:id', blogMediaUpload.array('media', 10), updateBlog);
//router.delete("/blogs/:id", deleteBlog);
exports.default = router;
