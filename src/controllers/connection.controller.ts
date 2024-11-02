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
