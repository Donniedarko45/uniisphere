import { Router } from "express";
import {
  createBlog,
  getAllBlogs,
  getBlogById,
} from "../controllers/blogs.controller";
import {
  postLimiter,
  uploadLimiter,
} from "../middlewares/rateLimiter.middleware";
import { authenticate } from "../middlewares/auth.middleware";
//import { blogMediaUpload } from '../middlewares/upload.middleware';
//import { storyUpload } from "../middlewares/upload.middleware";
const router = Router();
import { upload } from "../middlewares/upload.middleware";
router.get("/allBlogs", getAllBlogs);

router.get("/blog/:id", getBlogById);

router.post(
  "/create",
  authenticate,

  upload.array("media", 2),
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
