import { Server, Socket } from "socket.io";
import prisma from "../config/prisma";
let io: Server;

export const setupSocket = (server: any) => {
  io = new Server(server, {
    cors: {
      origin: "*",
    },
  });
  io.on("connection", (socket: Socket) => {
    console.log("New client connnected: ", socket.id);

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

    socket.on("groupMessage", (data) => {
      io.to(data.groupId).emit("groupMessage", data);
    });

    // Add anonymous chat handlers
    socket.on("join-anonymous-chat", (userId: string) => {
      socket.join(userId);
      console.log(`User ${userId} joined anonymous chat room`);
    });

    socket.on("leave-anonymous-chat", (userId: string) => {
      socket.leave(userId);
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
      console.log("client disconnected", socket.id);
    });

    socket.on("disconnect", async () => {
      try {
        // Update user status when socket disconnects
        await prisma.user.update({
          where: { id: socket.data.userId },
          data: { 
            isOnline: false,
            status: 'offline',
            lastSeen: new Date()
          }
        });
      } catch (error) {
        console.error("Error updating user status on disconnect:", error);
      }
    });
  });

  return io;
};

export { io };
