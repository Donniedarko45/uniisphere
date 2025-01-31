"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const book_controller_1 = require("../controllers/book.controller");
const router = (0, express_1.Router)();
const bookController = new book_controller_1.BookController();
/*
   all the bookController routes should be protected
*/
// Apply auth to each route
router.post("/books", auth_middleware_1.authenticate, bookController.createBook);
router.get("/books", auth_middleware_1.authenticate, bookController.getBooks);
router.get("/books/:id", auth_middleware_1.authenticate, bookController.getBookById);
// Bookmark routes
router.post("/books/:bookId/bookmarks", auth_middleware_1.authenticate, bookController.createBookmark);
router.get("/books/:bookId/bookmarks", auth_middleware_1.authenticate, bookController.getBookmarks);
exports.default = router;
