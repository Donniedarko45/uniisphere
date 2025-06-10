import { Router } from "express";
import {
  createBlog,
  getAllBlogs,
  getBlogById,
} from "../controllers/blogs.controller";
import {
  postLimiter,
  uploadLimiter,
  dbIntensiveLimiter,
  searchLimiter,
} from "../middlewares/rateLimiter.middleware";
import { authenticate, verifyUser } from "../middlewares/auth.middleware";
//import { blogMediaUpload } from '../middlewares/upload.middleware';
import { storyUpload } from "../middlewares/upload.middleware";
const router = Router();

router.get("/allBlogs", getAllBlogs);

router.get("/blog/:id", getBlogById);

router.post(
  "/create",
  authenticate,
  verifyUser,
  postLimiter,
  uploadLimiter,
  storyUpload.array("media", 2),
  createBlog as any,
);

// Support multiple file uploads for create endpoint
//router.post('/create', authenticate, blogMediaUpload.array('files', 10), createBlog);

// Legacy route with single file upload (keeping for compatibility)
//router.post('/blog/create', authenticate, blogMediaUpload.array('files', 10), createBlog);

// Support multiple file uploads for both images and videos
//router.put('/blogs/:id', blogMediaUpload.array('media', 10), updateBlog);

//router.delete("/blogs/:id", deleteBlog);

export default router;
