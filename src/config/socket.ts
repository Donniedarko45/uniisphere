import { Server } from 'socket.io';
import { Server as HttpServer } from 'http';
import { anonymousChatService } from '../services/anonymousChatService';
import {
  AnonymousChatSocket,
  ClientToServerEvents,
  ServerToClientEvents
} from '../type/anonymousChat';

export function setupWebSocket(httpServer: HttpServer) {
  const io = new Server<ClientToServerEvents, ServerToClientEvents>(httpServer, {
    cors: {
      origin: process.env.CORS_ORIGIN,
      methods: ['GET', 'POST']
    }
  });

  io.on('connection', (socket: AnonymousChatSocket) => {
    const userId = socket.handshake.query.userId as string;
    if (!userId) {
      socket.disconnect();
      return;
    }

    anonymousChatService.updateUserOnlineStatus(userId, true)
      .then(() => {
        anonymousChatService.setUserOnline(userId, socket.id);
      })
      .catch(console.error);

    socket.on('join-queue', async () => {
      anonymousChatService.addToWaitingQueue(userId);
      try {
        await anonymousChatService.tryMatchUsers(io);
      } catch (error) {
        console.error('Error in matching users:', error);
      }
    });


    socket.on('send-anonymous-message', async ({ chatId, content, isUser1 }) => {
      try {
        const message = await anonymousChatService.createMessage(chatId, content, userId, isUser1);
        const recipientSocketId = anonymousChatService.getRecipientSocketId(chatId, userId, isUser1);

        if (recipientSocketId) {
          io.to(recipientSocketId).emit('receive-anonymous-message', message);
        }
      } catch (error) {
        console.error('Error sending message:', error);
      }
    });

    // Handle chat ending
    socket.on('end-chat', async ({ chatId }) => {
      try {
        await anonymousChatService.endChat(chatId);
        socket.broadcast.to(chatId).emit('chat-ended', { chatId });
      } catch (error) {
        console.error('Error ending chat:', error);
      }
    });

    // Handle disconnection
    socket.on('disconnect', () => {
      anonymousChatService.removeUser(userId);
      anonymousChatService.updateUserOnlineStatus(userId, false)
        .catch(console.error);
    });
  });

  return io;
} 
