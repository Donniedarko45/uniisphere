import { Router } from "express";
import { PrismaClient } from "@prisma/client";
import { authenticateToken } from "../middlewares/auth";

const router = Router();
const prisma = new PrismaClient();

// Get active chat for a user
router.get("/active", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
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

    return res.json(activeChat);
  } catch (error) {
    console.error("Error fetching active chat:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// Get chat history
router.get("/history", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
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

    return res.json(chats);
  } catch (error) {
    console.error("Error fetching chat history:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// Get messages for a specific chat
router.get("/:chatId/messages", authenticateToken, async (req, res) => {
  try {
    const { chatId } = req.params;
    const userId = req.user.id;

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
      return res.status(404).json({ error: "Chat not found" });
    }

    const messages = await prisma.anonymousMessage.findMany({
      where: {
        chatId
      },
      orderBy: {
        createdAt: "asc"
      }
    });

    return res.json(messages);
  } catch (error) {
    console.error("Error fetching messages:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// Report a user in anonymous chat
router.post("/:chatId/report", authenticateToken, async (req, res) => {
  try {
    const { chatId } = req.params;
    const { reason } = req.body;
    const userId = req.user.id;

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
      return res.status(404).json({ error: "Chat not found" });
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
          activityType: "REPORT_ANONYMOUS_CHAT",
          targetId: chatId,
          metadata: { reason }
        }
      })
    ]);

    return res.json({ message: "Chat reported and ended successfully" });
  } catch (error) {
    console.error("Error reporting chat:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// Delete chat history
router.delete("/:chatId", authenticateToken, async (req, res) => {
  try {
    const { chatId } = req.params;
    const userId = req.user.id;

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
      return res.status(404).json({ error: "Chat not found or not ended" });
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

    return res.json({ message: "Chat deleted successfully" });
  } catch (error) {
    console.error("Error deleting chat:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

export default router; 