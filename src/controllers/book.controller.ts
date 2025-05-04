import { Request, Response } from 'express';
import { BookService } from '../services/book.service';

export const listAllBooks = async (req: Request, res: Response): Promise<any> => {
    try {
        const bookService = BookService.getInstance();
        const books = await bookService.listAllBooks();
        res.json(books);
    } catch (error) {
        console.error('Error in listAllBooks:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}; 