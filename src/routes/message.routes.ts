import { Router, RequestHandler } from "express";
import {
  sendMessage,
  getMessages,
  getConversations,
  deleteMessage,
} from "../controllers/message.controller";
import { authenticate } from "../middlewares/auth.middleware";
import {
  messageLimiter,
  dbIntensiveLimiter,
} from "../middlewares/rateLimiter.middleware";

const router = Router();

// Apply authentication middleware to all message routes
router.use(authenticate);

// Send a new message with rate limiting to prevent spam
router.post("/", sendMessage as RequestHandler);

// Get messages between two users (conversation) - database intensive
router.get("/conversation/:userId", getMessages as RequestHandler);

// Get all conversations for the authenticated user - database intensive
router.get("/conversations", getConversations as RequestHandler);

// Delete a message
router.delete("/:messageId", deleteMessage as RequestHandler);

export default router;

