"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const blogs_controller_1 = require("../controllers/blogs.controller");
const upload_middleware_1 = require("../middlewares/upload.middleware");
const router = (0, express_1.Router)();
router.get('/allBlogs', blogs_controller_1.getAllBlogs);
router.get('/blog/:id', blogs_controller_1.getBlogById);
// Support multiple file uploads for both images and videos
router.post('/blog/create', upload_middleware_1.blogMediaUpload.array('media', 10), blogs_controller_1.createBlog);
// Support multiple file uploads for both images and videos
router.put('/blogs/:id', upload_middleware_1.blogMediaUpload.array('media', 10), blogs_controller_1.updateBlog);
router.delete('/blogs/:id', blogs_controller_1.deleteBlog);
exports.default = router;
