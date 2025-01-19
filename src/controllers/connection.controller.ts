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

    await prisma.connection.create({
      data: {
        userId1,
        userId2,
      },
    });

    return res.status(201).json({ message: "Connection request sent" });
  } catch (error) {
    console.error("Error sending connection request:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// Accept a connection request

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

// Get user's connections
export const getConnections = async (req: Request, res: Response) => {
  const userId = req.body.userId; // Extract from token

  const connections = await prisma.connection.findMany({
    where: {
      OR: [
        { userId1: userId, status: "accepted" },
        { userId2: userId, status: "accepted" },
      ],
    },
    include: {
      user1: true,
      user2: true,
    },
  });

  res.status(200).json({ connections });
};
