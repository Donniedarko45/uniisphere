import { PrismaClient } from '@prisma/client';
import { AnonymousChatServer } from '../type/anonymousChat';

const prisma = new PrismaClient();

class AnonymousChatService {
  private onlineUsers: Map<string, string> = new Map(); // userId -> socketId
  private waitingUsers: Set<string> = new Set(); // userId of users waiting for match

  constructor() {}

  async updateUserOnlineStatus(userId: string, isOnline: boolean) {
    return prisma.user.update({
      where: { id: userId },
      data: { 
        isOnline,
        lastSeen: new Date()
      }
    });
  }

  setUserOnline(userId: string, socketId: string) {
    this.onlineUsers.set(userId, socketId);
  }

  removeUser(userId: string) {
    this.onlineUsers.delete(userId);
    this.waitingUsers.delete(userId);
  }

  addToWaitingQueue(userId: string) {
    this.waitingUsers.add(userId);
  }

  async createMessage(chatId: string, content: string, senderId: string, isUser1: boolean) {
    return prisma.anonymousMessage.create({
      data: {
        chatId,
        content,
        senderId,
        isUser1
      }
    });
  }

  async endChat(chatId: string) {
    return prisma.anonymousChat.update({
      where: { id: chatId },
      data: { 
        status: 'ended',
        endedAt: new Date()
      }
    });
  }

  async tryMatchUsers(io: AnonymousChatServer) {
    if (this.waitingUsers.size >= 2) {
      const waitingArray = Array.from(this.waitingUsers);
      const user1Id = waitingArray[0];
      const user2Id = waitingArray[1];

      // Remove matched users from waiting list
      this.waitingUsers.delete(user1Id);
      this.waitingUsers.delete(user2Id);

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
        const user1SocketId = this.onlineUsers.get(user1Id);
        const user2SocketId = this.onlineUsers.get(user2Id);

        if (user1SocketId) {
          io.to(user1SocketId).emit('chat-matched', { chatId: chat.id, isUser1: true });
        }
        if (user2SocketId) {
          io.to(user2SocketId).emit('chat-matched', { chatId: chat.id, isUser1: false });
        }

        return chat;
      } catch (error) {
        console.error('Error matching users:', error);
        // Put users back in waiting list if matching fails
        this.waitingUsers.add(user1Id);
        this.waitingUsers.add(user2Id);
        throw error;
      }
    }
    return null;
  }

  getRecipientSocketId(chatId: string, senderId: string, isUser1: boolean) {
    const recipientId = isUser1 ? chatId : senderId;
    return this.onlineUsers.get(recipientId);
  }
}

export const anonymousChatService = new AnonymousChatService(); 