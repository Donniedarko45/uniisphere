"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const message_controller_1 = require("../controllers/message.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const rateLimiter_middleware_1 = require("../middlewares/rateLimiter.middleware");
const router = (0, express_1.Router)();
// Apply authentication middleware to all message routes
router.use(auth_middleware_1.authenticate);
// Send a new message with rate limiting to prevent spam
router.post("/", rateLimiter_middleware_1.messageLimiter, message_controller_1.sendMessage);
// Get messages between two users (conversation) - database intensive
router.get("/conversation/:userId", rateLimiter_middleware_1.dbIntensiveLimiter, message_controller_1.getMessages);
// Get all conversations for the authenticated user - database intensive
router.get("/conversations", rateLimiter_middleware_1.dbIntensiveLimiter, message_controller_1.getConversations);
// Delete a message
router.delete("/:messageId", message_controller_1.deleteMessage);
exports.default = router;
