import { Server, Socket } from "socket.io";
import prisma from "../config/prisma";

let io: Server;
const CHAT_TIMEOUT = 30 * 60 * 1000; // 30 minutes
const chatTimeouts = new Map();

export const setupSocket = (server: any) => {
  if (io) {
    console.log('Socket.io instance already exists, cleaning up...');
    io.close();
  }

  io = new Server(server, {
    cors: {
      origin: "*",
    },
  });

  io.on("connection", (socket: Socket) => {
    console.log("New client connected: ", socket.id);
    
    // Clear any existing listeners to prevent duplicates
    socket.removeAllListeners();

    // Handle user joining their personal room
    socket.on("join", (userId: string) => {
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
    socket.on("join-anonymous-chat", (userId: string) => {
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

    socket.on("leave-anonymous-chat", (userId: string) => {
      socket.leave(userId);
      const timeout = chatTimeouts.get(userId);
      if (timeout) {
        clearTimeout(timeout);
        chatTimeouts.delete(userId);
      }
      console.log(`User ${userId} left anonymous chat room`);
    });

    socket.on("anonymous-message", (data: {
      chatId: string,
      content: string,
      isUser1: boolean,
      senderId: string
    }) => {
      const recipientId = data.isUser1 ? data.chatId : data.senderId;
      io.to(recipientId).emit("anonymous-message", data);
    });

    socket.on("disconnected", () => {
      console.log("Client disconnected", socket.id);
      // Clean up any rooms this socket was in
      socket.rooms.forEach(room => {
        socket.leave(room);
      });
    });

    socket.on("disconnect", async () => {
      try {
        // Update user status when socket disconnects
        if (socket.data.userId) {
          await prisma.user.update({
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
      } catch (error) {
        console.error("Error updating user status on disconnect:", error);
      }
    });
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

export { io };
