import { NextFunction, Request, Response } from "express";
import prisma from "../config/prisma";

interface AuthRequest extends Request {
  userId?: string;
}

export const getFeed = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<any> => {
  try {
    const { cursor, limit, filter } = req.query;
    const userId = req.userId;
    const pageSize = parseInt(limit as string) || 10;

    // Get user's connections and interests
    const userNetwork = await prisma.connection.findMany({
      where: {
        OR: [
          { userId1: userId, status: "accepted" },
          { userId2: userId, status: "accepted" },
        ],
      },
      select: {
        userId1: true,
        userId2: true,
      },
    });

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { Interests: true },
    });

    const connectedUserIds = userNetwork
      .flatMap((conn) => [conn.userId1, conn.userId2])
      .filter((id) => id !== userId);

    const baseQuery: any = {
      take: pageSize,
      skip: cursor ? 1 : 0,
      cursor: cursor ? { id: cursor as string } : undefined,
      where: {
        OR: [
          { userId: { in: connectedUserIds } }, // Posts from connections
          { userId: userId }, // User's own posts
          {
            AND: [
              { visibility: "public" },
              { tags: { hasSome: user?.Interests || [] } }, // Posts matching user interests
            ],
          },
        ],
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            profilePictureUrl: true,
            headline: true,
          },
        },
        Comments: {
          include: {
            user: {
              select: {
                username: true,
                profilePictureUrl: true,
              },
            },
          },
          take: 3,
          orderBy: { createdAt: "desc" },
        },
        Likes: true,
        _count: {
          select: {
            Comments: true,
            Likes: true,
            Share: true,
          },
        },
      },
      orderBy: [
        {
          createdAt: "desc",
        },
        {
          _count: {
            Likes: "desc",
          },
        },
      ],
    };

    // Apply additional filters if specified
    if (filter === "trending") {
      baseQuery.orderBy = [
        { _count: { Likes: "desc" } },
        { _count: { Comments: "desc" } },
        { createdAt: "desc" },
      ];
    }

    const posts = await prisma.post.findMany(baseQuery);

    // Calculate engagement score for each post
    const postsWithEngagement = posts.map((post: any) => {
      const engagementScore =
        (post._count?.Likes || 0) * 1 +
        (post._count?.Comments || 0) * 2 +
        (post._count?.Share || 0) * 3;

      return {
        ...post,
        engagementScore,
        commentPreview: post.Comments.slice(0, 3),
        totalComments: post._count?.Comments || 0,
        totalLikes: post._count?.Likes || 0,
        totalShares: post._count?.Share || 0,
      };
    });

    const nextCursor = posts.length ? posts[posts.length - 1].id : null;

    res.json({
      posts: postsWithEngagement,
      nextCursor,
      hasMore: posts.length === pageSize,
    });
  } catch (error) {
    console.error("Error fetching feed posts:", error);
    next(error);
  }
};

