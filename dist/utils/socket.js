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
const setupSocket = (server) => {
    exports.io = io = new socket_io_1.Server(server, {
        cors: {
            origin: "*",
        },
    });
    io.on("connection", (socket) => {
        console.log("New client connnected: ", socket.id);
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
        socket.on("groupMessage", (data) => {
            io.to(data.groupId).emit("groupMessage", data);
        });
        // Add anonymous chat handlers
        socket.on("join-anonymous-chat", (userId) => {
            socket.join(userId);
            console.log(`User ${userId} joined anonymous chat room`);
        });
        socket.on("leave-anonymous-chat", (userId) => {
            socket.leave(userId);
            console.log(`User ${userId} left anonymous chat room`);
        });
        socket.on("anonymous-message", (data) => {
            const recipientId = data.isUser1 ? data.chatId : data.senderId;
            io.to(recipientId).emit("anonymous-message", data);
        });
        socket.on("disconnected", () => {
            console.log("client disconnected", socket.id);
        });
        socket.on("disconnect", () => __awaiter(void 0, void 0, void 0, function* () {
            try {
                // Update user status when socket disconnects
                yield prisma_1.default.user.update({
                    where: { id: socket.data.userId },
                    data: {
                        isOnline: false,
                        status: 'offline',
                        lastSeen: new Date()
                    }
                });
            }
            catch (error) {
                console.error("Error updating user status on disconnect:", error);
            }
        }));
    });
    return io;
};
exports.setupSocket = setupSocket;
