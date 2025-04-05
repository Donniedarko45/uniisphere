import { Router, RequestHandler } from "express";
import { sendMessage, getMessages, getConversations, deleteMessage } from "../controllers/message.controller";
import { authenticate } from "../middlewares/auth.middleware";

const router = Router();

// Apply authentication middleware to all message routes
router.use(authenticate);

// Send a new message
router.post("/", sendMessage as RequestHandler);

// Get messages between two users (conversation)
router.get("/conversation/:userId", getMessages as RequestHandler);

// Get all conversations for the authenticated user
router.get("/conversations", getConversations as RequestHandler);

// Delete a message
router.delete("/:messageId", deleteMessage as RequestHandler);

export default router; 