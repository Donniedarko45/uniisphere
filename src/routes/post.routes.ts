import { Router } from "express";
import { getFeed } from "../controllers/feed.controller";
import {
  createComment,
  createPost,
  deletePost,
  getPost,
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

// Public routes
router.get("/:postId", getPost as any);

// Protected routes - Feed
router.get("/feed", authenticate, getFeed);

// Protected routes - User specific 
router.get("/user/:userId", authenticate, getPost as any);

// Protected routes - Post operations
router.get("/stats/total", authenticate, getTotalPosts);

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

router.get("/getUserAllPost", authenticate, getUserPosts)

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

// Changed from DELETE /:postId to DELETE /:postId/unlike
router.delete("/:postId/unlike",
  authenticate,
  unlikePost
);

export default router;
