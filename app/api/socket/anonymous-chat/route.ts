import { Server } from 'socket.io';
import { NextApiRequest } from 'next';
import { NextApiResponseServerIO } from '@/types/socket';
import prisma from '@/lib/prisma';

const onlineUsers = new Map<string, string>(); // userId -> socketId
const waitingUsers = new Set<string>(); // userId of users waiting for match

export async function GET(req: NextApiRequest, res: NextApiResponseServerIO) {
  if (res.socket.server.io) {
    console.log('Socket is already running');
    return new Response('Socket is already running');
  }

  console.log('Socket is initializing');
  const io = new Server(res.socket.server, {
    path: '/api/socket/anonymous-chat',
    addTrailingSlash: false,
  });

  io.on('connection', async (socket) => {
    const userId = socket.handshake.query.userId as string;
    
    // Update user's online status
    await prisma.user.update({
      where: { id: userId },
      data: { isOnline: true, lastSeen: new Date() }
    });

    onlineUsers.set(userId, socket.id);

    // Handle user joining waiting queue
    socket.on('join-queue', async () => {
      waitingUsers.add(userId);
      await tryMatchUsers(io);
    });

    // Handle chat messages
    socket.on('send-anonymous-message', async ({ chatId, content, isUser1 }) => {
      try {
        const message = await prisma.anonymousMessage.create({
          data: {
            chatId,
            content,
            senderId: userId,
            isUser1
          }
        });

        const chat = await prisma.anonymousChat.findUnique({
          where: { id: chatId }
        });

        if (chat) {
          const recipientId = isUser1 ? chat.userId2 : chat.userId1;
          const recipientSocketId = onlineUsers.get(recipientId);
          if (recipientSocketId) {
            io.to(recipientSocketId).emit('receive-anonymous-message', message);
          }
        }
      } catch (error) {
        console.error('Error sending anonymous message:', error);
      }
    });

    // Handle chat ending
    socket.on('end-chat', async ({ chatId }) => {
      try {
        await prisma.anonymousChat.update({
          where: { id: chatId },
          data: { 
            status: 'ended',
            endedAt: new Date()
          }
        });

        const chat = await prisma.anonymousChat.findUnique({
          where: { id: chatId }
        });

        if (chat) {
          [chat.userId1, chat.userId2].forEach((uid) => {
            const socketId = onlineUsers.get(uid);
            if (socketId) {
              io.to(socketId).emit('chat-ended', { chatId });
            }
          });
        }
      } catch (error) {
        console.error('Error ending chat:', error);
      }
    });

    // Handle disconnection
    socket.on('disconnect', async () => {
      onlineUsers.delete(userId);
      waitingUsers.delete(userId);
      await prisma.user.update({
        where: { id: userId },
        data: { 
          isOnline: false,
          lastSeen: new Date()
        }
      });
    });
  });

  res.socket.server.io = io;
  return new Response('Socket is initialized');
}

// Function to match waiting users
async function tryMatchUsers(io: Server) {
  if (waitingUsers.size >= 2) {
    const waitingArray = Array.from(waitingUsers);
    const user1Id = waitingArray[0];
    const user2Id = waitingArray[1];

    // Remove matched users from waiting list
    waitingUsers.delete(user1Id);
    waitingUsers.delete(user2Id);

    try {
      // Create new anonymous chat
      const chat = await prisma.anonymousChat.create({
        data: {
          userId1: user1Id,
          userId2: user2Id,
          status: 'active'
        }
      });

      // Notify both users
      const user1SocketId = onlineUsers.get(user1Id);
      const user2SocketId = onlineUsers.get(user2Id);

      if (user1SocketId) {
        io.to(user1SocketId).emit('chat-matched', { chatId: chat.id, isUser1: true });
      }
      if (user2SocketId) {
        io.to(user2SocketId).emit('chat-matched', { chatId: chat.id, isUser1: false });
      }
    } catch (error) {
      console.error('Error matching users:', error);
      // Put users back in waiting list if matching fails
      waitingUsers.add(user1Id);
      waitingUsers.add(user2Id);
    }
  }
} 