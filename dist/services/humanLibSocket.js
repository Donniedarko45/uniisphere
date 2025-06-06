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
exports.setupHumanLibSocket = void 0;
const prisma_1 = __importDefault(require("../config/prisma"));
const onlineUsers = new Map(); // userId -> socketId
const setupHumanLibSocket = (io) => {
    const humanLibNamespace = io.of('/human-lib');
    humanLibNamespace.on('connection', (socket) => {
        const userId = socket.handshake.query.userId;
        if (!userId)
            return socket.disconnect();
        onlineUsers.set(userId, socket.id);
        prisma_1.default.user.update({
            where: { id: userId },
            data: { isOnline: true },
        });
        console.log(`HumanLib: User ${userId} connected`);
        socket.on('send_message', (_a) => __awaiter(void 0, [_a], void 0, function* ({ receiverId, content }) {
            const message = yield prisma_1.default.message.create({
                data: {
                    senderId: userId,
                    receiverId,
                    content,
                },
            });
            const receiverSocketId = onlineUsers.get(receiverId);
            if (receiverSocketId) {
                humanLibNamespace.to(receiverSocketId).emit('receive_message', message);
            }
        }));
        socket.on('disconnect', () => {
            onlineUsers.delete(userId);
            prisma_1.default.user.update({
                where: { id: userId },
                data: {
                    isOnline: false,
                    lastSeen: new Date(),
                },
            });
            console.log(`HumanLib: User ${userId} disconnected`);
        });
    });
    return humanLibNamespace;
};
exports.setupHumanLibSocket = setupHumanLibSocket;
