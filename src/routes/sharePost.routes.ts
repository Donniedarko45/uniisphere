import express from 'express';
import { sharePost, getSharedPosts, unsharePost } from '../controllers/sharePost.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = express.Router();

// Share a post
router.post('/:postId', authenticate, sharePost as any);

// Get user's shared posts
router.get('/my-shares', authenticate, getSharedPosts as any);

// Unshare a post
router.delete('/:postId', authenticate, unsharePost as any);

export default router; 