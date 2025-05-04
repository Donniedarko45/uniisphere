import express from 'express';
import { listAllBooks } from '../controllers/book.controller';

const router = express.Router();

// Route to list all books
router.get('/', listAllBooks);

export default router; 