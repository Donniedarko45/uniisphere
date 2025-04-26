"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const message_controller_1 = require("../controllers/message.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const router = (0, express_1.Router)();
// Apply authentication middleware to all message routes
router.use(auth_middleware_1.authenticate);
// Send a new message
router.post("/", message_controller_1.sendMessage);
// Get messages between two users (conversation)
router.get("/conversation/:userId", message_controller_1.getMessages);
// Get all conversations for the authenticated user
router.get("/conversations", message_controller_1.getConversations);
// Delete a message
router.delete("/:messageId", message_controller_1.deleteMessage);
exports.default = router;
