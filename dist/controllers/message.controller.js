"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteMessage = exports.getConversations = exports.getMessages = exports.sendMessage = void 0;
const prisma_1 = __importDefault(require("../config/prisma"));
const socket_1 = require("../utils/socket");
const sendMessage = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { receiverId, content } = req.body;
    const senderId = req.userId;
    if (!senderId || !receiverId || !content) {
        return res.status(400).json({ error: "Missing required fields" });
    }
    try {
        const [sender, receiver] = yield Promise.all([
            prisma_1.default.user.findUnique({ where: { id: senderId } }),
            prisma_1.default.user.findUnique({ where: { id: receiverId } }),
        ]);
        if (!sender || !receiver) {
            return res.status(404).json({ error: "User not found" });
        }
        const connection = yield prisma_1.default.connection.findFirst({
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
        const message = yield prisma_1.default.message.create({
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
        if (socket_1.io && socket_1.io.to) {
            socket_1.io.to(receiverId).emit("newMessage", message);
        }
        res.status(201).json(message);
    }
    catch (error) {
        console.error("Error sending message:", error);
        res.status(500).json({ error: "Failed to send message" });
    }
});
exports.sendMessage = sendMessage;
const getMessages = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const userId = req.userId;
    const otherUserId = req.params.userId;
    const { cursor, limit = 20 } = req.query;
    if (!userId || !otherUserId) {
        return res.status(400).json({ error: "Missing required parameters" });
    }
    try {
        const messages = yield prisma_1.default.message.findMany({
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
            cursor: cursor ? { id: cursor } : undefined,
            skip: cursor ? 1 : 0,
        });
        res.status(200).json(messages);
    }
    catch (error) {
        console.error("Error fetching messages:", error);
        res.status(500).json({ error: "Failed to fetch messages" });
    }
});
exports.getMessages = getMessages;
const getConversations = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const userId = req.userId;
    if (!userId) {
        return res.status(400).json({ error: "Missing user ID" });
    }
    try {
        // Get all unique users the authenticated user has messaged with
        const conversations = yield prisma_1.default.message.findMany({
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
        const uniqueConversations = conversations.reduce((acc, message) => {
            const otherUser = message.sender.id === userId ? message.receiver : message.sender;
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
    }
    catch (error) {
        console.error("Error fetching conversations:", error);
        res.status(500).json({ error: "Failed to fetch conversations" });
    }
});
exports.getConversations = getConversations;
const deleteMessage = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const userId = req.userId;
    const messageId = req.params.messageId;
    if (!userId || !messageId) {
        return res.status(400).json({ error: "Missing required parameters" });
    }
    try {
        // Check if the message exists and belongs to the user
        const message = yield prisma_1.default.message.findUnique({
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
        yield prisma_1.default.message.delete({
            where: { id: messageId },
        });
        res.status(200).json({ message: "Message deleted successfully" });
    }
    catch (error) {
        console.error("Error deleting message:", error);
        res.status(500).json({ error: "Failed to delete message" });
    }
});
exports.deleteMessage = deleteMessage;
