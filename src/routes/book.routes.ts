import { Router } from 'express';

import { authenticate } from '../middlewares/auth.middleware';
import { BookController } from '../controllers/book.controller';

const router = Router();
const bookController = new BookController()

// Apply auth to each route
router.post('/books', authenticate, bookController.createBook);
router.get('/books', authenticate, bookController.getBooks);
router.get('/books/:id', authenticate, bookController.getBookById);

// Bookmark routes
router.post('/books/:bookId/bookmarks', authenticate, bookController.createBookmark);
router.get('/books/:bookId/bookmarks', authenticate, bookController.getBookmarks);

export default router;