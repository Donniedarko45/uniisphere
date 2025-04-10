import { Router, Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { authenticate } from "../middlewares/auth.middleware";

// Define types for authenticated request
interface AuthenticatedRequest extends Request {
  userId?: string;
}

const router = Router();
const prisma = new PrismaClient();

// Get active chat for a user
router.get("/active", authenticate, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const userId = req.userId;
    const activeChat = await prisma.anonymousChat.findFirst({
      where: {
        OR: [
          { userId1: userId },
          { userId2: userId }
        ],
        status: "active"
      },
      include: {
        messages: {
          orderBy: {
            createdAt: "asc"
          }
        }
      }
    });

    res.json(activeChat);
  } catch (error) {
    console.error("Error fetching active chat:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get chat history
router.get("/history", authenticate, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const userId = req.userId;
    const chats = await prisma.anonymousChat.findMany({
      where: {
        OR: [
          { userId1: userId },
          { userId2: userId }
        ],
        status: "ended"
      },
      include: {
        messages: {
          orderBy: {
            createdAt: "asc"
          }
        }
      },
      orderBy: {
        createdAt: "desc"
      }
    });

    res.json(chats);
  } catch (error) {
    console.error("Error fetching chat history:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get messages for a specific chat
router.get("/:chatId/messages", authenticate, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const { chatId } = req.params;
    const userId = req.userId;

    // Verify user is part of this chat
    const chat = await prisma.anonymousChat.findFirst({
      where: {
        id: chatId,
        OR: [
          { userId1: userId },
          { userId2: userId }
        ]
      }
    });

    if (!chat) {
      res.status(404).json({ error: "Chat not found" });
      return;
    }

    const messages = await prisma.anonymousMessage.findMany({
      where: {
        chatId
      },
      orderBy: {
        createdAt: "asc"
      }
    });

    res.json(messages);
  } catch (error) {
    console.error("Error fetching messages:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Report a user in anonymous chat
router.post("/:chatId/report", authenticate, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const { chatId } = req.params;
    const { reason } = req.body;
    const userId = req.userId;

    // Verify user is part of this chat
    const chat = await prisma.anonymousChat.findFirst({
      where: {
        id: chatId,
        OR: [
          { userId1: userId },
          { userId2: userId }
        ]
      }
    });

    if (!chat) {
      res.status(404).json({ error: "Chat not found" });
      return;
    }

    // Create report and end chat
    await prisma.$transaction([
      prisma.anonymousChat.update({
        where: { id: chatId },
        data: {
          status: "ended",
          endedAt: new Date()
        }
      }),
      prisma.userActivity.create({
        data: {
          userId,
          activityType: `REPORT_ANONYMOUS_CHAT:${reason}`, // Include reason in activityType
          targetId: chatId
        }
      })
    ]);

    res.json({ message: "Chat reported and ended successfully" });
  } catch (error) {
    console.error("Error reporting chat:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Delete chat history
router.delete("/:chatId", authenticate, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const { chatId } = req.params;
    const userId = req.userId;

    // Verify user is part of this chat and chat is ended
    const chat = await prisma.anonymousChat.findFirst({
      where: {
        id: chatId,
        OR: [
          { userId1: userId },
          { userId2: userId }
        ],
        status: "ended"
      }
    });

    if (!chat) {
      res.status(404).json({ error: "Chat not found or not ended" });
      return;
    }

    // Delete messages and chat
    await prisma.$transaction([
      prisma.anonymousMessage.deleteMany({
        where: { chatId }
      }),
      prisma.anonymousChat.delete({
        where: { id: chatId }
      })
    ]);

    res.json({ message: "Chat deleted successfully" });
  } catch (error) {
    console.error("Error deleting chat:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router; 