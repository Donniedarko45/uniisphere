import { Router } from 'express';
import {
  getAllBlogs,
  getBlogById,
  createBlog,
  updateBlog,
  deleteBlog
} from '../controllers/blogs.controller';

const router = Router();

router.get('/allBlogs', getAllBlogs);

router.get('/blog/:id', getBlogById);

router.post('/blog/create', createBlog);

router.put('/blogs/:id', updateBlog);

router.delete('/blogs/:id', deleteBlog);

export default router; 
