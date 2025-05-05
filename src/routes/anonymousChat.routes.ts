import { Router } from 'express';
import {
  createAnonymousChat,
  endAnonymousChat,
  sendAnonymousMessage
} from '../controllers/anonymous.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

// Create or join an anonymous chat
router.post('/create', authenticate, createAnonymousChat);

// Send a message in an anonymous chat
router.post('/message', authenticate, sendAnonymousMessage);

// End an anonymous chat
router.post('/end/:chatId', authenticate, endAnonymousChat);

export default router;
