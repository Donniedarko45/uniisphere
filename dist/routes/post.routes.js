"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const feed_controller_1 = require("../controllers/feed.controller");
const post_controller_1 = require("../controllers/post.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const upload_middleware_1 = require("../middlewares/upload.middleware");
const rateLimiter_middleware_1 = require("../middlewares/rateLimiter.middleware");
const router = (0, express_1.Router)();
// Public routes
router.get("/:postId", post_controller_1.getPost);
// Protected routes - Feed
router.get("/feed", auth_middleware_1.authenticate, feed_controller_1.getFeed);
// Protected routes - User specific 
router.get("/user/:userId", auth_middleware_1.authenticate, post_controller_1.getPost);
// Protected routes - Post operations
router.get("/stats/total", auth_middleware_1.authenticate, post_controller_1.getTotalPosts);
router.post("/", auth_middleware_1.authenticate, auth_middleware_1.verifyUser, rateLimiter_middleware_1.postLimiter, rateLimiter_middleware_1.uploadLimiter, upload_middleware_1.upload.array("media", 5), post_controller_1.createPost);
router.put("/:postId", auth_middleware_1.authenticate, auth_middleware_1.verifyUser, post_controller_1.updatePost);
router.delete("/:postId", auth_middleware_1.authenticate, auth_middleware_1.verifyUser, post_controller_1.deletePost);
router.get("/getUserAllPost", auth_middleware_1.authenticate, post_controller_1.getUserPosts);
// Protected routes - Social interactions
router.post("/:postId/comments", auth_middleware_1.authenticate, post_controller_1.createComment);
router.post("/:postId/like", auth_middleware_1.authenticate, auth_middleware_1.verifyUser, post_controller_1.likePost);
// Changed from DELETE /:postId to DELETE /:postId/unlike
router.delete("/:postId/unlike", auth_middleware_1.authenticate, post_controller_1.unlikePost);
exports.default = router;
