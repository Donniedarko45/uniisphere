import { Server as SocketIOServer } from 'socket.io';
import { Socket } from 'socket.io';

export interface AnonymousMessage {
  id: string;
  content: string;
  chatId: string;
  senderId: string;
  isUser1: boolean;
  createdAt: Date;
}

export interface AnonymousChat {
  id: string;
  userId1: string;
  userId2: string;
  status: 'active' | 'ended';
  createdAt: Date;
  endedAt?: Date;
}

export interface SocketData {
  userId: string;
}

export interface ServerToClientEvents {
  'chat-matched': (data: { chatId: string; isUser1: boolean }) => void;
  'receive-anonymous-message': (message: AnonymousMessage) => void;
  'chat-ended': (data: { chatId: string }) => void;
}

export interface ClientToServerEvents {
  'join-queue': () => void;
  'send-anonymous-message': (data: { chatId: string; content: string; isUser1: boolean }) => void;
  'end-chat': (data: { chatId: string }) => void;
}

export type AnonymousChatSocket = Socket<ClientToServerEvents, ServerToClientEvents>;
export type AnonymousChatServer = SocketIOServer<ClientToServerEvents, ServerToClientEvents>; 