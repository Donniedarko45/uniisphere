import { Router } from "express";
import { getFeed } from "../controllers/feed.controller";
import {
  createComment,
  createPost,
  deletePost,
  getPost,
  getTotalPosts,
  likePost,
  unlikePost,
  updatePost
} from "../controllers/post.controller";
import { authenticate, verifyUser } from "../middlewares/auth.middleware";
import { upload } from "../middlewares/upload.middleware";

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
  upload.single("media"),
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
  likePost
);

router.delete("/:postId/unlike",
  authenticate,
  unlikePost
);

export default router;
