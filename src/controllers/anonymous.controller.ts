import { Request, Response } from 'express';
import prisma from '../config/prisma';
import { io } from '../utils/socket'; // Make sure io is correctly exported and accessible

export const createAnonymousChat = async (req: Request, res: Response): Promise<any> => {
    const { nickname } = req.body; // Keep nickname if needed for display later, but not for matching logic
    const userId = req.body.userId; // Get userId from authenticated request

    if (!userId) {
        // This should ideally be caught by the authenticate middleware
        return res.status(401).json({ error: 'User not authenticated' });
    }

    try {
        // Ensure the requesting user is marked as available (frontend should have done this, but belt-and-suspenders)
        // Optional: You might trust the frontend call, but this ensures state.
        await prisma.user.update({
            where: { id: userId },
            data: { status: 'available', isOnline: true }, // Mark as available and online
        });

        // Look for another available user
        const waitingUser = await prisma.user.findFirst({
            where: {
                id: { not: userId }, // *** Crucial: Exclude self ***
                isOnline: true,
                status: 'available', // *** Crucial: Look for users specifically available for chat ***
                // Keep the checks to ensure they aren't *already* in an active anonymous chat
                anonymousChats1: {
                    none: {
                        status: 'active',
                    },
                },
                anonymousChats2: {
                    none: {
                        status: 'active',
                    },
                },
            },
        });

        if (waitingUser) {
            // --- Match Found! ---
            console.log(`Match found between ${userId} and ${waitingUser.id}`);

            // Create the chat room
            const chat = await prisma.anonymousChat.create({
                data: {
                    userId1: waitingUser.id, // Assign consistently (e.g., waiting user is user1)
                    userId2: userId,         // Requesting user is user2
                    status: 'active',
                },
            });

            // *** Update both users' status to 'chatting' ***
            await prisma.user.updateMany({
                where: {
                    id: { in: [userId, waitingUser.id] },
                },
                data: {
                    status: 'chatting',
                },
            });

            // Emit events to both users via Socket.IO
            // Ensure users are joined to rooms identified by their userId
            io.to(waitingUser.id).emit('chat-matched', { chatId: chat.id, isUser1: true }); // waitingUser is user1
            io.to(userId).emit('chat-matched', { chatId: chat.id, isUser1: false });       // requesting user is user2

            // Return success response to the requesting user
            return res.status(201).json({
                message: 'Match found!', // Added message for clarity
                chatId: chat.id,
                isUser1: false, // Requesting user is user2 in this setup
            });

        } else {
            // --- No Match Found Yet ---
            console.log(`User ${userId} is waiting for a match...`);
            // User remains 'available'. Frontend will poll again.
            return res.status(200).json({ message: 'Waiting for another user to join' });
        }
    } catch (error) {
        console.error(`Error in createAnonymousChat for user ${userId}:`, error);
        // Attempt to reset user status if something went wrong before matching
        try {
            await prisma.user.update({
                where: { id: userId },
                data: { status: 'available' }, // Reset to available on error? Or maybe 'online'? Depends on desired state.
            });
        } catch (resetError) {
            console.error(`Failed to reset status for user ${userId} after error:`, resetError);
        }
        return res.status(500).json({ error: 'Internal server error during chat creation' });
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
        });

        if (!chat) {
            return res.status(404).json({ error: 'Chat not found' });
        }

        if (chat.status !== 'active') {
            console.log(`Attempt to send message to non-active chat ${chatId} by user ${userId}`);
            return res.status(400).json({ error: `Chat has ended or is not active (status: ${chat.status})` });
        }

        // Verify sender matches isUser1 flag relative to chat participants
        const expectedSenderId = isUser1 ? chat.userId1 : chat.userId2;
        if (userId !== expectedSenderId) {
             console.warn(`Sender ID mismatch in chat ${chatId}. User ${userId}, isUser1: ${isUser1}. Chat U1: ${chat.userId1}, U2: ${chat.userId2}`);
             // Decide how strict to be. For now, allow but warn. Could return 403 Forbidden.
             // return res.status(403).json({ error: 'Sender ID does not match role in chat' });
        }


        const message = await prisma.anonymousMessage.create({
            data: {
                chatId,
                content,
                senderId: userId,
                isUser1, // Store who sent it relative to the chat setup
            },
        });

        // Emit message to the *other* user
        const recipientId = isUser1 ? chat.userId2 : chat.userId1;
        // Pass the message object, and also explicitly pass `isUser1` of the *sender*
        // so the recipient knows if it came from their "user1" or "user2" partner.
        io.to(recipientId).emit('anonymous-message', {
            ...message, // Send full message details
            // isUser1 here refers to the *sender* of the message
        });
        console.log(`Message sent in chat ${chatId} from ${userId} (isUser1: ${isUser1}) to ${recipientId}`);


        return res.status(201).json(message);
    } catch (error) {
        console.error(`Error sending anonymous message for chat ${chatId} by user ${userId}:`, error);
        return res.status(500).json({ error: 'Internal server error while sending message' });
    }
};

export const endAnonymousChat = async (req: Request, res: Response): Promise<any> => {
    const { chatId } = req.params;
    const userId = req.body.userId; // Get userId to know who initiated the end

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
            // Optionally update status back to available if somehow missed
             await prisma.user.updateMany({
                where: {
                    id: { in: [chat.userId1, chat.userId2] },
                    status: 'chatting', // Only update if they are still marked as chatting
                },
                data: {
                    status: 'available',
                },
            });
            return res.status(200).json({ message: 'Chat had already ended.' });
        }

        // Update chat status to 'ended'
        const updatedChat = await prisma.anonymousChat.update({
            where: { id: chatId },
            data: {
                status: 'ended',
                endedAt: new Date(),
            },
        });

        // *** Update both users' status back to 'available' ***
        await prisma.user.updateMany({
            where: {
                id: { in: [updatedChat.userId1, updatedChat.userId2] },
            },
            data: {
                status: 'available', // Set them back to available
            },
        });
         console.log(`Chat ${chatId} ended by ${userId}. Users ${updatedChat.userId1} and ${updatedChat.userId2} set to available.`);


        // Notify both users that the chat has ended
        io.to(updatedChat.userId1).emit('chat-ended', { chatId });
        io.to(updatedChat.userId2).emit('chat-ended', { chatId });

        return res.status(200).json({ message: 'Chat ended successfully' });
    } catch (error) {
        console.error(`Error ending chat ${chatId} by user ${userId}:`, error);
         // Attempt to reset status if error occurred during ending process
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

// Current socket.ts lacks anonymous chat event handlers
// Should add these handlers:
socket.on("join-anonymous-chat", (userId: string) => {
  socket.join(userId);
});

socket.on("anonymous-message", (data: {chatId: string, content: string}) => {
  // Handle anonymous messages
});
