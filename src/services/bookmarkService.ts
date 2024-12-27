import { PrismaClient } from "@prisma/client";
import type { CreateBookmarkDTO } from "../type/book";

const prisma = new PrismaClient();

export class BookmarkService {
  async createBookmark(userId: string, bookmark: CreateBookmarkDTO) {
    return await prisma.bookmark.create({
      data: {
        ...bookmark,
        userId,
      },
    });
  }

  async getBookmarks(userId: string) {
    return await prisma.bookmark.findMany({
      where: {
        userId,
      },
      include: {
        book: true,
      },
    });
  }

  async deleteBookmark(userId: string, bookmarkId: string) {
    return await prisma.bookmark.delete({
      where: {
        id: bookmarkId,
        userId,
      },
    });
  }
}
