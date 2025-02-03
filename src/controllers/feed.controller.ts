import prisma from "../config/prisma";
import { NextFunction, Request, Response } from "express";
export const getFeed = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<any> => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const posts = await prisma.post.findMany({
      skip,
      take: Number(limit),
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { username: true, profilePictureUrl: true } },
        Likes: true,
        Comments: true,
      },
    });
    res.status(200).json(posts);
  } catch (error) {
    next(error);
  }
};
