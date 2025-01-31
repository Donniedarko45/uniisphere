"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BookController = void 0;
const book_1 = require("../type/book");
const bookService_1 = require("../services/bookService");
const bookmarkService_1 = require("../services/bookmarkService");
const bookService = new bookService_1.BookService();
const bookmarkService = new bookmarkService_1.BookmarkService();
class BookController {
    createBook(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const validateData = book_1.BookSchema.parse(req.body);
                const book = yield bookService.createBook(validateData);
                res.status(201).json(book);
            }
            catch (error) {
                next(error);
            }
        });
    }
    getBooks(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const books = yield bookService.getBooks();
                res.status(200).json(books);
            }
            catch (error) {
                next(error);
            }
        });
    }
    getBookById(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { id } = req.params;
                const book = yield bookService.getBookById(id);
                if (!book) {
                    res.status(404).json({ message: "Book not found" });
                }
                else {
                    res.status(200).json(book);
                }
            }
            catch (error) {
                next(error);
            }
        });
    }
    createBookmark(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                const userId = (_a = req.body) === null || _a === void 0 ? void 0 : _a.userId;
                if (!userId) {
                    res.status(401).json({ message: "Unauthorized" });
                    return;
                }
                const validateData = book_1.BookmarkSchema.parse(req.body);
                const bookmark = yield bookmarkService.createBookmark(userId, validateData);
                res.status(201).json(bookmark);
            }
            catch (error) {
                next(error);
            }
        });
    }
    getBookmarks(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const userId = req.userId;
                const bookId = req.query.bookId;
                if (!userId) {
                    res.status(401).json({ message: "Unauthorized" });
                    return;
                }
                const bookmarks = yield bookmarkService.getBookmarks(userId, bookId);
                res.status(200).json(bookmarks);
            }
            catch (error) {
                next(error);
            }
        });
    }
}
exports.BookController = BookController;
