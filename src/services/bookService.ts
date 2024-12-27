import { PrismaClient } from "@prisma/client";
import type { CreateBookDTO } from "../type/book";

const prisma = new PrismaClient();

export class BookService {
  async createBook(book: CreateBookDTO) {
    return await prisma.book.create({
      data: {
        ...book,
        views: 0,
      },
      include: {
        category: true,
      },
    });
  }

  async getBooks() {
    return await prisma.book.findMany({
      include: {
        category: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  }

  async getBookById(id: string) {
    const book = await prisma.book.update({
      where: { id },
      data: {
        views: { increment: 1 },
      },
      include: {
        category: true,
        bookmarks: true,
      },
    });
    return book;
  }

  async searchBooks(query: string) {
    return await prisma.book.findMany({
      where: {
        OR: [
          { title: { contains: query, mode: "insensitive" } },
          { author: { contains: query, mode: "insensitive" } },
        ],
      },
      include: {
        category: true,
      },
    });
  }
}
