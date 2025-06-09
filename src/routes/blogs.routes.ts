import { Router } from 'express';
import {
  getAllBlogs,
  getBlogById,
  createBlog,
  updateBlog,
  deleteBlog
} from '../controllers/blogs.controller';
import { blogMediaUpload } from '../middlewares/upload.middleware';
import { Request, Response, NextFunction } from 'express';
import multer from 'multer';

const router = Router();

// Multer error handling wrapper
const handleUploadErrors = (req: Request, res: Response, next: NextFunction) => {
  const upload = blogMediaUpload.single('titleMedia');
  
  upload(req, res, (err: any) => {
    if (err) {
      console.error('Multer error:', err);
      
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({
            success: false,
            message: 'File too large. Maximum size is 30MB for videos and 5MB for images.'
          });
        }
        if (err.code === 'LIMIT_UNEXPECTED_FILE') {
          return res.status(400).json({
            success: false,
            message: 'Unexpected field name. Please use "titleMedia" for file uploads.'
          });
        }
      }
      
      return res.status(400).json({
        success: false,
        message: err.message || 'File upload error'
      });
    }
    
    next();
  });
};

router.get('/allBlogs', getAllBlogs);

router.get('/blog/:id', getBlogById);

// Support single file upload for title media with error handling
router.post('/blog/create', handleUploadErrors, createBlog);

// Support multiple file uploads for both images and videos
router.put('/blogs/:id', blogMediaUpload.array('media', 10), updateBlog);

router.delete('/blogs/:id', deleteBlog);

export default router; 
