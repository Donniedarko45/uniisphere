import { z } from "zod";

export const BookSchema = z.object({
  title: z.string().min(1).max(255),
  author: z.string().min(1).max(255),
  description: z.string().optional(),
  categoryId: z.string().uuid(),
});


export const BookmarkSchema = z.object({
  page: z.number().min(1),
  note: z.string().optional(),
  bookId: z.string().uuid(),
});

export type CreateBookDTO = z.infer<typeof BookSchema>;
export type CreateBookmarkDTO = z.infer<typeof BookmarkSchema>;
