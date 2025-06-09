import { Router } from 'express';
import {
  getAllBlogs,
  getBlogById,
  createBlog,
  updateBlog,
  deleteBlog
} from '../controllers/blogs.controller';
import { blogMediaUpload } from '../middlewares/upload.middleware';

const router = Router();

router.get('/allBlogs', getAllBlogs);

router.get('/blog/:id', getBlogById);

// Support multiple file uploads for both images and videos
router.post('/blog/create', blogMediaUpload.array('media', 10), createBlog);

// Support multiple file uploads for both images and videos
router.put('/blogs/:id', blogMediaUpload.array('media', 10), updateBlog);

router.delete('/blogs/:id', deleteBlog);

export default router; 
