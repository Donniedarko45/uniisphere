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
exports.BookmarkService = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
class BookmarkService {
    createBookmark(userId, bookmark) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield prisma.bookmark.create({
                data: Object.assign(Object.assign({}, bookmark), { userId }),
                include: {
                    book: true,
                },
            });
        });
    }
    getBookmarks(userId, bookId) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield prisma.bookmark.findMany({
                where: {
                    userId,
                    bookId,
                },
                orderBy: {
                    page: "asc",
                },
            });
        });
    }
    deleteBookmark(userId, bookmarkId) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield prisma.bookmark.delete({
                where: {
                    id: bookmarkId,
                    userId,
                },
            });
        });
    }
}
exports.BookmarkService = BookmarkService;
