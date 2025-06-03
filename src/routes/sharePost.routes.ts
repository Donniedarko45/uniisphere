import express from 'express';
import { sharePost, getSharedPosts } from '../controllers/sharePost.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = express.Router();


router.post('/:postId', authenticate, sharePost as any);

router.get('/my-shares', authenticate, getSharedPosts as any);

export default router; 