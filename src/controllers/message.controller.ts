import { Request, Response } from "express";
import prisma from "../config/prisma";
import { io } from "../utils/socket";

interface AuthenticatedRequest extends Request {
  userId?: string;
}

export const sendMessage = async (req: AuthenticatedRequest, res: Response) => {
  const { receiverId, content } = req.body;
  const senderId = req.userId;

  if (!senderId || !receiverId || !content) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    const [sender, receiver] = await Promise.all([
      prisma.user.findUnique({ where: { id: senderId } }),
      prisma.user.findUnique({ where: { id: receiverId } }),
    ]);

    if (!sender || !receiver) {
      return res.status(404).json({ error: "User not found" });
    }

    const connection = await prisma.connection.findFirst({
      where: {
        OR: [
          { userId1: senderId, userId2: receiverId, status: "accepted" },
          { userId1: receiverId, userId2: senderId, status: "accepted" },
        ],
      },
    });

    if (!connection) {
      return res
        .status(403)
        .json({ error: "Users must be connected to send messages" });
    }

    const message = await prisma.message.create({
      data: {
        senderId,
        receiverId,
        content,
      },
      include: {
        sender: {
          select: {
            id: true,
            username: true,
            profilePictureUrl: true,
          },
        },
        receiver: {
          select: {
            id: true,
            username: true,
            profilePictureUrl: true,
          },
        },
      },
    });

    // Emit real-time message to receiver if socket is available
    if (io && io.to) {
      io.to(receiverId).emit("newMessage", message);
    }

    res.status(201).json(message);
  } catch (error) {
    console.error("Error sending message:", error);
    res.status(500).json({ error: "Failed to send message" });
  }
};

export const getMessages = async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.userId;
  const otherUserId = req.params.userId;
  const { cursor, limit = 20 } = req.query;

  if (!userId || !otherUserId) {
    return res.status(400).json({ error: "Missing required parameters" });
  }

  try {
    const messages = await prisma.message.findMany({
      where: {
        OR: [
          { senderId: userId, receiverId: otherUserId },
          { senderId: otherUserId, receiverId: userId },
        ],
      },
      include: {
        sender: {
          select: {
            id: true,
            username: true,
            profilePictureUrl: true,
          },
        },
        receiver: {
          select: {
            id: true,
            username: true,
            profilePictureUrl: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: Number(limit),
      cursor: cursor ? { id: cursor as string } : undefined,
      skip: cursor ? 1 : 0,
    });

    res.status(200).json(messages);
  } catch (error) {
    console.error("Error fetching messages:", error);
    res.status(500).json({ error: "Failed to fetch messages" });
  }
};

export const getConversations = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  const userId = req.userId;

  if (!userId) {
    return res.status(400).json({ error: "Missing user ID" });
  }

  try {
    // Get all unique users the authenticated user has messaged with
    const conversations = await prisma.message.findMany({
      where: {
        OR: [{ senderId: userId }, { receiverId: userId }],
      },
      select: {
        sender: {
          select: {
            id: true,
            username: true,
            profilePictureUrl: true,
          },
        },
        receiver: {
          select: {
            id: true,
            username: true,
            profilePictureUrl: true,
          },
        },
        content: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Process conversations to get unique users and latest message
    const uniqueConversations = conversations.reduce((acc: any, message) => {
      const otherUser =
        message.sender.id === userId ? message.receiver : message.sender;
      if (!acc[otherUser.id]) {
        acc[otherUser.id] = {
          user: otherUser,
          lastMessage: message.content,
          timestamp: message.createdAt,
        };
      }
      return acc;
    }, {});

    res.status(200).json(Object.values(uniqueConversations));
  } catch (error) {
    console.error("Error fetching conversations:", error);
    res.status(500).json({ error: "Failed to fetch conversations" });
  }
};

export const deleteMessage = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  const userId = req.userId;
  const messageId = req.params.messageId;

  if (!userId || !messageId) {
    return res.status(400).json({ error: "Missing required parameters" });
  }

  try {
    // Check if the message exists and belongs to the user
    const message = await prisma.message.findUnique({
      where: { id: messageId },
    });

    if (!message) {
      return res.status(404).json({ error: "Message not found" });
    }

    if (message.senderId !== userId) {
      return res
        .status(403)
        .json({ error: "Not authorized to delete this message" });
    }

    // Delete the message
    await prisma.message.delete({
      where: { id: messageId },
    });

    res.status(200).json({ message: "Message deleted successfully" });
  } catch (error) {
    console.error("Error deleting message:", error);
    res.status(500).json({ error: "Failed to delete message" });
  }
};
