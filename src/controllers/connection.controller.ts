import { Request, Response } from "express";
import prisma from "../config/prisma";

interface AuthenticatedRequest extends Request {
  body: {
    userId: string;
    [key: string]: any;
  };
}

export const sendConnectionRequest = async (
  req: AuthenticatedRequest,
  res: Response,
): Promise<any> => {
  const userId1 = req.body.userId;
  const userId2 = req.params.userId;

  try {
    const existingConnection = await prisma.connection.findUnique({
      where: { userId1_userId2: { userId1, userId2 } },
    });

    if (existingConnection) {
      return res.status(400).json({ message: "Connection already exists" });
    }

    const newConnection = await prisma.connection.create({
      data: {
        userId1,
        userId2,
      },
    });

    return res.status(201).json({
      message: "Connection request sent",
      connectionId: newConnection.id
    });
  } catch (error) {
    console.error("Error sending connection request:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};


export const acceptConnection = async (req: Request, res: Response) => {
  const { connectionId } = req.params;

  await prisma.connection.update({
    where: { id: connectionId },
    data: { status: "accepted" },
  });

  res.status(200).json({ message: "Connection accepted" });
};

// Decline a connection request
export const declineConnection = async (req: Request, res: Response) => {
  const { connectionId } = req.params;

  await prisma.connection.update({
    where: { id: connectionId },
    data: { status: "declined" },
  });

  res.status(200).json({ message: "Connection declined" });
};

export const getConnections = async (req: Request, res: Response) => {
  try {
    const userId = req.body.userId;

    const [connections, stats] = await Promise.all([
      prisma.connection.findMany({
        where: {
          OR: [
            { userId1: userId, status: "accepted" },
            { userId2: userId, status: "accepted" },
          ],
        },
        include: {
          user1: {
            select: {
              id: true,
              username: true,
              profilePictureUrl: true,
              headline: true
            }
          },
          user2: {
            select: {
              id: true,
              username: true,
              profilePictureUrl: true,
              headline: true
            }
          },
        },
      }),

      // Get connection stats
      prisma.$transaction([
        prisma.connection.count({
          where: {
            OR: [
              { userId1: userId, status: "accepted" },
              { userId2: userId, status: "accepted" }
            ],
          }
        }),
        prisma.connection.count({
          where: {
            userId2: userId,
            status: "accepted"
          }
        }),
        prisma.connection.count({
          where: {
            userId1: userId,
            status: "accepted"
          }
        })
      ])
    ]);

    const [totalConnections, followers, following] = stats;

    res.status(200).json({
      connections: connections.map(conn => ({
        ...conn,
        otherUser: conn.userId1 === userId ? conn.user2 : conn.user1
      })),
      stats: {
        totalConnections,
        followers,
        following
      }
    });
  } catch (error) {
    console.error("Error fetching connections:", error);
    res.status(500).json({ error: "Failed to fetch connections" });
  }
};

// Add this new function to get connection stats
export const getConnectionStats = async (req: Request, res: Response) => {
  try {
    const userId = req.params.userId;

    // Get total connections (accepted only)
    const connectionsCount = await prisma.connection.count({
      where: {
        OR: [
          { userId1: userId, status: "accepted" },
          { userId2: userId, status: "accepted" }
        ],
      }
    });

    // Get followers (where this user is userId2)
    const followersCount = await prisma.connection.count({
      where: {
        userId2: userId,
        status: "accepted"
      }
    });

    // Get following (where this user is userId1)
    const followingCount = await prisma.connection.count({
      where: {
        userId1: userId,
        status: "accepted"
      }
    });

    // Get pending requests received
    const pendingRequestsCount = await prisma.connection.count({
      where: {
        userId2: userId,
        status: "pending"
      }
    });

    res.status(200).json({
      stats: {
        totalConnections: connectionsCount,
        followers: followersCount,
        following: followingCount,
        pendingRequests: pendingRequestsCount
      }
    });

  } catch (error) {
    console.error("Error fetching connection stats:", error);
    res.status(500).json({ error: "Failed to fetch connection statistics" });
  }
};
