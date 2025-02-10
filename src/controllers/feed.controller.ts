import prisma from "../config/prisma";
import { NextFunction, Request, Response } from "express";
export const getFeed = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<any> => {
  try {
    const { cursor, limit } = req.query;
    const pageSize = parseInt(limit as string) || 10;
    const posts = await prisma.post.findMany({
      take: pageSize,
      skip: cursor ? 1 : 0,
      cursor: cursor ? { id: cursor as string } : undefined,
      orderBy: { createdAt: "desc" },
      include: {
        user: true,
        Comments: true,
        Likes: true,
      },
    });
    const nextCursor = posts.length ? posts[posts.length - 1].id : null;
    res.json({ posts, nextCursor });
  } catch (error) {
    console.error("error fetching feed posts", error);
    next(error);
    res.status(500).json({ error: "Internal server error" });
  }
};
