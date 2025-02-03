import { Router } from "express";
import { upload } from "../middlewares/upload.middleware";
import { createPost, updatePost, deletePost, getPost, getUserPosts } from '../controllers/post.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { getFeed } from "../controllers/feed.controller";

const router = Router();

// Public routes (no authentication needed)
router.get('/:postId', getPost as any);  


// Protected routes (authentication required)
router.post('/', authenticate, upload.single("media"), createPost);
router.put('/:postId', authenticate, updatePost);
router.delete('/:postId', authenticate, deletePost);
router.get('/user/:userId', authenticate, getUserPosts);
router.get('/getFeed',authenticate,getFeed);
export default router;





