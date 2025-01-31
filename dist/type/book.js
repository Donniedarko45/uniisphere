"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BookmarkSchema = exports.BookSchema = void 0;
const zod_1 = require("zod");
exports.BookSchema = zod_1.z.object({
    title: zod_1.z.string().min(1).max(255),
    author: zod_1.z.string().min(1).max(255),
    description: zod_1.z.string().optional(),
    categoryId: zod_1.z.string().uuid(),
});
exports.BookmarkSchema = zod_1.z.object({
    page: zod_1.z.number().min(1),
    note: zod_1.z.string().optional(),
    bookId: zod_1.z.string().uuid(),
});
