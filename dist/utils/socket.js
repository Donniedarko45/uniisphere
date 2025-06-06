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
exports.io = exports.setupSocket = void 0;
const socket_io_1 = require("socket.io");
const prisma_1 = __importDefault(require("../config/prisma"));
let io;
const CHAT_TIMEOUT = 30 * 60 * 1000; // 30 minutes
const chatTimeouts = new Map();
const setupSocket = (server) => {
    if (io) {
        console.log('Socket.io instance already exists, cleaning up...');
        io.close();
    }
    exports.io = io = new socket_io_1.Server(server, {
        cors: {
            origin: "*",
        },
    });
    io.on("connection", (socket) => {
        console.log("New client connected: ", socket.id);
        // Clear any existing listeners to prevent duplicates
        socket.removeAllListeners();
        // Handle user joining their personal room
        socket.on("join", (userId) => {
            socket.join(userId);
            console.log(`User ${userId} joined their personal room`);
        });
        socket.on("message", (data) => {
            io.to(data.recieverId).emit("message", data);
        });
        socket.on("join group", (groupId) => {
            socket.join(groupId);
        });
        socket.on("leave group", (groupId) => {
            socket.leave(groupId);
        });
        socket.on("groupMessage", (data) => {
            io.to(data.groupId).emit("groupMessage", data);
        });
        // Add anonymous chat handlers with timeout cleanup
        socket.on("join-anonymous-chat", (userId) => {
            socket.join(userId);
            console.log(`User ${userId} joined anonymous chat room`);
            // Clear existing timeout if any
            const existingTimeout = chatTimeouts.get(userId);
            if (existingTimeout) {
                clearTimeout(existingTimeout);
            }
            // Set new timeout
            chatTimeouts.set(userId, setTimeout(() => {
                socket.leave(userId);
                chatTimeouts.delete(userId);
                console.log(`User ${userId} auto-removed from anonymous chat after timeout`);
            }, CHAT_TIMEOUT));
        });
        socket.on("leave-anonymous-chat", (userId) => {
            socket.leave(userId);
            const timeout = chatTimeouts.get(userId);
            if (timeout) {
                clearTimeout(timeout);
                chatTimeouts.delete(userId);
            }
            console.log(`User ${userId} left anonymous chat room`);
        });
        socket.on("anonymous-message", (data) => {
            io.to(data.recipientId).emit("anonymous-message", data);
        });
        socket.on("disconnected", () => {
            console.log("Client disconnected", socket.id);
            // Clean up any rooms this socket was in
            socket.rooms.forEach(room => {
                socket.leave(room);
            });
        });
        socket.on("disconnect", () => __awaiter(void 0, void 0, void 0, function* () {
            try {
                // Update user status when socket disconnects
                if (socket.data.userId) {
                    yield prisma_1.default.user.update({
                        where: { id: socket.data.userId },
                        data: {
                            isOnline: false,
                            status: 'offline',
                            lastSeen: new Date()
                        }
                    });
                    // Clean up any timeouts associated with this user
                    const timeout = chatTimeouts.get(socket.data.userId);
                    if (timeout) {
                        clearTimeout(timeout);
                        chatTimeouts.delete(socket.data.userId);
                    }
                }
            }
            catch (error) {
                console.error("Error updating user status on disconnect:", error);
            }
        }));
    });
    // Cleanup on process exit
    process.on('SIGTERM', () => {
        console.log('SIGTERM received, cleaning up socket connections...');
        // Clear all timeouts
        chatTimeouts.forEach((timeout) => clearTimeout(timeout));
        chatTimeouts.clear();
        io.close(() => {
            console.log('Socket.io server closed');
        });
    });
    return io;
};
exports.setupSocket = setupSocket;
