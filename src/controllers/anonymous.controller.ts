import { Request, Response } from 'express';
import prisma from '../config/prisma';
import { io } from '../utils/socket';

export const createAnonymousChat = async (req: Request, res: Response):Promise<any> => {
  const { nickname } = req.body;
  
  if (!nickname) {
    return res.status(400).json({ error: 'Nickname is required' });
  }

  try {
    // Add user to waiting pool
    const waitingUser = await prisma.user.findFirst({
      where: {
        isOnline: true,
        anonymousChats1: {
          none: {
            status: 'active'
          }
        },
        anonymousChats2: {
          none: {
            status: 'active'
          }
        }
      }
    });

    if (waitingUser) {
      // Create a new chat room with both users
      const chat = await prisma.anonymousChat.create({
        data: {
          userId1: waitingUser.id,
          userId2: req.body.userId,
          status: 'active'
        }
      });

      // Emit events to both users
      io.to(waitingUser.id).emit('chat-matched', { chatId: chat.id, isUser1: true });
      io.to(req.body.userId).emit('chat-matched', { chatId: chat.id, isUser1: false });

      return res.status(201).json({
        chatId: chat.id,
        isUser1: false
      });
    }

    return res.status(200).json({ message: 'Waiting for another user to join' });
  } catch (error) {
    console.error('Error in anonymous chat:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

export const sendAnonymousMessage = async (req: Request, res: Response):Promise<any> => {
  const { chatId, content, isUser1 } = req.body;
  const userId = req.body.userId;

  try {
    const chat = await prisma.anonymousChat.findUnique({
      where: { id: chatId }
    });

    if (!chat) {
      return res.status(404).json({ error: 'Chat not found' });
    }

    if (chat.status !== 'active') {
      return res.status(400).json({ error: 'Chat has ended' });
    }

    const message = await prisma.anonymousMessage.create({
      data: {
        chatId,
        content,
        senderId: userId,
        isUser1
      }
    });

    // Emit message to the other user
    const recipientId = isUser1 ? chat.userId2 : chat.userId1;
    io.to(recipientId).emit('anonymous-message', message);

    return res.status(201).json(message);
  } catch (error) {
    console.error('Error sending anonymous message:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

export const endAnonymousChat = async (req: Request, res: Response):Promise<any> => {
  const { chatId } = req.params;

  try {
    const chat = await prisma.anonymousChat.update({
      where: { id: chatId },
      data: {
        status: 'ended',
        endedAt: new Date()
      }
    });

    // Notify both users that the chat has ended
    io.to(chat.userId1).emit('chat-ended', { chatId });
    io.to(chat.userId2).emit('chat-ended', { chatId });

    return res.status(200).json({ message: 'Chat ended successfully' });
  } catch (error) {
    console.error('Error ending chat:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};