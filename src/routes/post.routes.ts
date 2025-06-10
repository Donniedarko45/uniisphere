import { Router, RequestHandler } from "express";
import { getFeed } from "../controllers/feed.controller";
import {
  createComment,
  createPost,
  deletePost,
  getPost,
  getPostLikes,
  getTotalPosts,
  getUserPosts,
  likePost,
  unlikePost,
  updatePost
} from "../controllers/post.controller";
import { authenticate, verifyUser } from "../middlewares/auth.middleware";
import { upload } from "../middlewares/upload.middleware";
import { 
  postLimiter, 
  uploadLimiter, 
  dbIntensiveLimiter,
  searchLimiter 
} from "../middlewares/rateLimiter.middleware";

const router = Router();

// Protected routes - Feed
router.get("/feed", authenticate, getFeed);

// Protected routes - User posts
router.get("/getUserAllPost", authenticate, getUserPosts as RequestHandler);

// Protected routes - Post operations
router.get("/stats/total", authenticate, getTotalPosts);

// Protected routes - Post by ID
router.get("/:postId", getPost as RequestHandler);

// Protected routes - User specific 
router.get("/user/:userId", authenticate, getPost as RequestHandler);

router.post("/",
  authenticate,
  verifyUser,
  postLimiter,
  uploadLimiter,
  upload.array("media", 5),
  createPost
);

router.put("/:postId",
  authenticate,
  verifyUser,
  updatePost
);

router.delete("/:postId",
  authenticate,
  verifyUser,
  deletePost
);

// Protected routes - Social interactions
router.post("/:postId/comments",
  authenticate,
  createComment
);

router.post("/:postId/like",
  authenticate,
  verifyUser,
  likePost
);

router.delete("/:postId/unlike",
  authenticate,
  unlikePost
);

// Get users who liked a post
router.get("/:postId/likes",
  authenticate,
  getPostLikes as RequestHandler
);

export default router;
