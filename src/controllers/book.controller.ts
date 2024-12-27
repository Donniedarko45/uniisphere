import { Request, Response, NextFunction } from "express";
import { BookmarkSchema, BookSchema } from "../type/book";
import { BookService } from "../services/bookService";
import { BookmarkService } from "../services/bookmarkService";

const bookService = new BookService();
const bookmarkService = new BookmarkService();

export class BookController {
  async createBook(req: Request, res: Response, next: NextFunction) {
    try {
      const validateData = BookSchema.parse(req.body);
      const book = await bookService.createBook(validateData);
      res.status(201).json(book);
    } catch (error) {
      next(error);
    }
  }

  async getBooks(req: Request, res: Response, next: NextFunction) {
    try {
      const books = await bookService.getBooks();
      res.status(200).json(books);
    } catch (error) {
      next(error);
    }
  }

  async getBookById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const book = await bookService.getBookById(id);
      if (!book) {
        res.status(404).json({ message: "Book not found" });
      } else {
        res.status(200).json(book);
      }
    } catch (error) {
      next(error);
    }
  }

  async createBookmark(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.body?.userId;
      if (!userId) {
        res.status(401).json({ message: "Unauthorized" });
        return;
      }
      const validateData = BookmarkSchema.parse(req.body);
      const bookmark = await bookmarkService.createBookmark(userId, validateData);
      res.status(201).json(bookmark);
    } catch (error) {
      next(error);
    }
  }

  async getBookmarks(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).userId;
      const bookId = req.query.bookId as string;
      if (!userId) {
        res.status(401).json({ message: "Unauthorized" });
        return;
      }
      const bookmarks = await bookmarkService.getBookmarks(userId, bookId);
      res.status(200).json(bookmarks);
    } catch (error) {
      next(error);
    }
  }
}
