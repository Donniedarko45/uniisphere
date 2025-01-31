"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const upload_middleware_1 = require("../middlewares/upload.middleware");
const post_controller_1 = require("../controllers/post.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const router = (0, express_1.Router)();
// Public routes (no authentication needed)
router.get('/:postId', post_controller_1.getPost);
// Protected routes (authentication required)
router.post('/', auth_middleware_1.authenticate, upload_middleware_1.upload.single("media"), post_controller_1.createPost);
router.put('/:postId', auth_middleware_1.authenticate, post_controller_1.updatePost);
router.delete('/:postId', auth_middleware_1.authenticate, post_controller_1.deletePost);
router.get('/user/:userId', auth_middleware_1.authenticate, post_controller_1.getUserPosts);
exports.default = router;
