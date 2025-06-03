import express from 'express';
import { createStory, getStories, viewStory, deleteStory } from '../controllers/story.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { storyUpload } from '../middlewares/upload.middleware';
import { 
  storyLimiter, 
  uploadLimiter, 
  dbIntensiveLimiter 
} from '../middlewares/rateLimiter.middleware';

const router = express.Router();

// Create a new story (supports both file upload and direct URL)
router.post('/', authenticate, storyLimiter, uploadLimiter, storyUpload.single('media'), createStory as any);

// Get all stories from connected users (database intensive)
router.get('/', authenticate, dbIntensiveLimiter, getStories as any);

// View a story
router.post('/:storyId/view', authenticate, viewStory as any);

// Delete a story
router.delete('/:storyId', authenticate, deleteStory as any);

export default router; 