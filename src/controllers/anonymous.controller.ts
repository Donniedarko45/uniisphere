import { Request, Response } from 'express';
import prisma from '../config/prisma';
import { io } from '../utils/socket'; // Make sure io is correctly exported and accessible

export const createAnonymousChat = async (req: Request, res: Response): Promise<any> => {
    const { nickname } = req.body;
    const userId = req.body.userId;

    if (!userId) {
        return res.status(401).json({ error: 'User not authenticated' });
    }

    try {
        // First check if user is already in an active chat
        const existingChat = await prisma.anonymousChat.findFirst({
            where: {
                OR: [
                    { userId1: userId, status: 'active' },
                    { userId2: userId, status: 'active' }
                ]
            }
        });

        if (existingChat) {
            return res.status(400).json({ 
                error: 'User already in an active chat',
                chatId: existingChat.id
            });
        }

        // Update user status atomically with a transaction
        await prisma.$transaction(async (tx) => {
            await tx.user.update({
                where: { id: userId },
                data: { 
                    status: 'available', 
                    isOnline: true,
                    lastSeen: new Date()
                },
            });

            const waitingUser = await tx.user.findFirst({
                where: {
                    id: { not: userId },
                    isOnline: true,
                    status: 'available',
                    anonymousChats1: { none: { status: 'active' } },
                    anonymousChats2: { none: { status: 'active' } },
                },
                select: {
                    id: true,
                    status: true
                }
            });

            if (waitingUser) {
                // Create chat and update both users' status atomically
                const chat = await tx.anonymousChat.create({
                    data: {
                        userId1: waitingUser.id,
                        userId2: userId,
                        status: 'active',
                    },
                });

                await tx.user.updateMany({
                    where: { id: { in: [userId, waitingUser.id] } },
                    data: { status: 'chatting' },
                });

                // Emit events after successful database transaction
                io.to(waitingUser.id).emit('chat-matched', { 
                    chatId: chat.id, 
                    isUser1: true,
                    partnerId: userId 
                });
                io.to(userId).emit('chat-matched', { 
                    chatId: chat.id, 
                    isUser1: false,
                    partnerId: waitingUser.id
                });

                return res.status(201).json({
                    message: 'Match found!',
                    chatId: chat.id,
                    isUser1: false,
                    partnerId: waitingUser.id
                });
            }

            return res.status(200).json({ 
                message: 'Waiting for another user to join',
                status: 'waiting'
            });
        });
    } catch (error) {
        console.error(`Error in createAnonymousChat for user ${userId}:`, error);
        
        // Attempt to reset user status
        try {
            await prisma.user.update({
                where: { id: userId },
                data: { 
                    status: 'online',  // Reset to online instead of available
                    isOnline: true,
                    lastSeen: new Date()
                },
            });
        } catch (resetError) {
            console.error(`Failed to reset status for user ${userId}:`, resetError);
        }
        
        return res.status(500).json({ 
            error: 'Internal server error during chat creation',
            details: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};

export const sendAnonymousMessage = async (req: Request, res: Response): Promise<any> => {
    const { chatId, content, isUser1 } = req.body;
    const userId = req.body.userId;

    if (!chatId || !content || typeof isUser1 !== 'boolean') {
        return res.status(400).json({ error: 'Missing required fields: chatId, content, isUser1' });
    }

    try {
        const chat = await prisma.anonymousChat.findUnique({
            where: { id: chatId },
            include: {
                user1: { select: { id: true } },
                user2: { select: { id: true } }
            }
        });

        if (!chat) {
            return res.status(404).json({ error: 'Chat not found' });
        }

        if (chat.status !== 'active') {
            return res.status(400).json({ 
                error: 'Chat is not active',
                status: chat.status
            });
        }

        // Verify sender is part of the chat
        const expectedSenderId = isUser1 ? chat.userId1 : chat.userId2;
        if (userId !== expectedSenderId) {
            return res.status(403).json({ error: 'You are not authorized to send messages in this chat' });
        }

        // Create message in transaction to ensure consistency
        const message = await prisma.$transaction(async (tx) => {
            // Check chat is still active
            const currentChat = await tx.anonymousChat.findUnique({
                where: { id: chatId }
            });
            
            if (currentChat?.status !== 'active') {
                throw new Error('Chat is no longer active');
            }

            return tx.anonymousMessage.create({
                data: {
                    chatId,
                    content,
                    senderId: userId,
                    isUser1,
                },
            });
        });

        // Determine recipient
        const recipientId = isUser1 ? chat.userId2 : chat.userId1;

        // Emit message to recipient
        io.to(recipientId).emit('anonymous-message', {
            ...message,
            recipientId,
            chatId
        });

        return res.status(201).json({
            message: 'Message sent successfully',
            data: message
        });
    } catch (error) {
        console.error(`Error sending anonymous message in chat ${chatId}:`, error);
        return res.status(500).json({ 
            error: 'Failed to send message',
            details: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};

export const endAnonymousChat = async (req: Request, res: Response): Promise<any> => {
    const { chatId } = req.params;
    const userId = req.body.userId;

    if (!chatId) {
        return res.status(400).json({ error: 'Chat ID is required in URL parameter' });
    }

    try {
        const chat = await prisma.anonymousChat.findUnique({
            where: { id: chatId },
        });

        if (!chat) {
            return res.status(404).json({ error: 'Chat not found' });
        }

        // Check if user is part of this chat
        if (userId !== chat.userId1 && userId !== chat.userId2) {
            console.warn(`User ${userId} attempted to end chat ${chatId} they are not part of.`);
            return res.status(403).json({ error: 'You are not authorized to end this chat.' });
        }

        if (chat.status === 'ended') {
            console.log(`Chat ${chatId} already ended. User ${userId} tried to end again.`);
            await prisma.user.updateMany({
                where: {
                    id: { in: [chat.userId1, chat.userId2] },
                    status: 'chatting',
                },
                data: {
                    status: 'available',
                },
            });
            return res.status(200).json({ message: 'Chat had already ended.' });
        }

        const updatedChat = await prisma.anonymousChat.update({
            where: { id: chatId },
            data: {
                status: 'ended',
                endedAt: new Date(),
            },
        });

        await prisma.user.updateMany({
            where: {
                id: { in: [updatedChat.userId1, updatedChat.userId2] },
            },
            data: {
                status: 'available',
            },
        });
        console.log(`Chat ${chatId} ended by ${userId}. Users ${updatedChat.userId1} and ${updatedChat.userId2} set to available.`);

        io.to(updatedChat.userId1).emit('chat-ended', { chatId });
        io.to(updatedChat.userId2).emit('chat-ended', { chatId });

        return res.status(200).json({ message: 'Chat ended successfully' });
    } catch (error) {
        console.error(`Error ending chat ${chatId} by user ${userId}:`, error);
        try {
            const chatUsers = await prisma.anonymousChat.findUnique({ where: { id: chatId }, select: { userId1: true, userId2: true }});
            if (chatUsers) {
                await prisma.user.updateMany({
                    where: { id: { in: [chatUsers.userId1, chatUsers.userId2] } },
                    data: { status: 'available' }
                });
            }
        } catch (resetError) {
            console.error(`Failed to reset user status after error ending chat ${chatId}:`, resetError);
        }
        return res.status(500).json({ error: 'Internal server error while ending chat' });
    }
};
