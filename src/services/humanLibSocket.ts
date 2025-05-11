import { Server } from 'socket.io';
import prisma from "../config/prisma";

const onlineUsers = new Map<string, string>(); // userId -> socketId

export const setupHumanLibSocket = (io: Server) => {
  const humanLibNamespace = io.of('/human-lib');

  humanLibNamespace.on('connection', (socket) => {
    const userId = socket.handshake.query.userId as string;

    if (!userId) return socket.disconnect();

    onlineUsers.set(userId, socket.id);
    prisma.user.update({
      where: { id: userId },
      data: { isOnline: true },
    });

    console.log(`HumanLib: User ${userId} connected`);

    socket.on('send_message', async ({ receiverId, content }) => {
      const message = await prisma.message.create({
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
    });

    socket.on('disconnect', () => {
      onlineUsers.delete(userId);
      prisma.user.update({
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
