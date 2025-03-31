import { NextFunction, Request, Response } from "express";
import prisma from "../config/prisma";
import { io } from "../utils/socket";

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
    // Check if connection already exists
    const existingConnection = await prisma.connection.findUnique({
      where: { userId1_userId2: { userId1, userId2 } },
    });

    if (existingConnection) {
      return res.status(400).json({ message: "Connection already exists" });
    }

    // Create new connection request
    const newConnection = await prisma.connection.create({
      data: {
        userId1,
        userId2,
        status: "pending"
      },
      include: {
        user1: {
          select: {
            id: true,
            username: true,
            profilePictureUrl: true,
            headline: true
          }
        }
      }
    });

    // Send real-time notification to recipient
    io.to(userId2).emit("connectionRequest", {
      connectionId: newConnection.id,
      sender: newConnection.user1,
      timestamp: new Date()
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

// Get pending connection requests
export const getPendingRequests = async (req: AuthenticatedRequest, res: Response,next:NextFunction):Promise<any> => {
  try {
    const userId = req.body.userId;

    const pendingRequests = await prisma.connection.findMany({
      where: {
        userId2: userId,
        status: "pending"
      },
      include: {
        user1: {
          select: {
            id: true,
            username: true,
            profilePictureUrl: true,
            headline: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return res.status(200).json({
      pendingRequests
    });
  } catch (error) {
    console.error("Error fetching pending requests:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const acceptConnection = async (req: Request, res: Response):Promise<any> => {
  const { connectionId } = req.params;
  const userId = req.body.userId;

  try {
    const connection = await prisma.connection.findUnique({
      where: { id: connectionId },
      include: {
        user1: true,
        user2: true
      }
    });

    if (!connection) {
      return res.status(404).json({ message: "Connection request not found" });
    }

    if (connection.userId2 !== userId) {
      return res.status(403).json({ message: "Not authorized to accept this request" });
    }

    await prisma.connection.update({
      where: { id: connectionId },
      data: { status: "accepted" },
    });

    // Notify the sender that their request was accepted
    io.to(connection.userId1).emit("connectionAccepted", {
      connectionId,
      acceptedBy: connection.user2
    });

    res.status(200).json({ message: "Connection accepted" });
  } catch (error) {
    console.error("Error accepting connection:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const declineConnection = async (req: Request, res: Response):Promise<any> => {
  const { connectionId } = req.params;
  const userId = req.body.userId;

  try {
    const connection = await prisma.connection.findUnique({
      where: { id: connectionId }
    });

    if (!connection) {
      return res.status(404).json({ message: "Connection request not found" });
    }

    if (connection.userId2 !== userId) {
      return res.status(403).json({ message: "Not authorized to decline this request" });
    }

    await prisma.connection.update({
      where: { id: connectionId },
      data: { status: "declined" },
    });

    res.status(200).json({ message: "Connection declined" });
  } catch (error) {
    console.error("Error declining connection:", error);
    res.status(500).json({ message: "Internal server error" });
  }
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
