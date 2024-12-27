import { Request, Response } from "express";
import { BookmarkSchema, BookSchema } from "../type/book";
import { BookService } from "../services/bookService";
import { BookmarkService } from "../services/bookmarkService";

const bookService = new BookService();
const bookmarkService = new BookmarkService();

export class BookController {
  async createBook(req: Request, res: Response) {
    try {
      const validateData = BookSchema.parse(req.body);
      const book = await bookService.createBook(validateData);
      return res.status(201).json(book);
    } catch (error) {
      console.error("Error creating book", error);
      return res.status(400).json({ error: "Invalid book data" });
    }
  }

  async getBooks(req: Request, res: Response) {
    try {
      const books = await bookService.getBooks();
      return res.status(200).json(books);
    } catch (error) {
      console.error("Error getting books", error);
      return res.status(500).json({ error: "Failed to get books" });
    }
  }

  async getBookById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const book = await bookService.getBookById(id);
      if (!book) {
        return res.status(404).json({ message: "Book not found" });
      }
      return res.status(200).json(book);
    } catch (error) {
      console.error("Error getting book by id", error);
      return res.status(500).json({ error: "Failed to get book" });
    }
  }

  async createBookmark(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      const validateData = BookmarkSchema.parse(req.body);
      const bookmark = await bookmarkService.createBookmark(
        userId,
        validateData,
      );
      return res.status(201).json(bookmark);
    } catch (error) {
      console.error("Error creating bookmark", error);
      return res.status(400).json({ error: "Invalid bookmark data" });
    }
  }

  async getBookmarks(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      const bookmarks = await bookmarkService.getBookmarks(userId);
      return res.status(200).json(bookmarks);
    } catch (error) {
      console.error("Error getting bookmarks", error);
      return res.status(500).json({ error: "Failed to get bookmarks" });
    }
  }
}
