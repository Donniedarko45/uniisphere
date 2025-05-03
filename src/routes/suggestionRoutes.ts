import express from 'express';
import { SuggestionController } from '../controllers/suggestionController';
import { authenticate } from "../middlewares/auth.middleware";

const router = express.Router();
router.use(authenticate);
// Get user suggestions
router.get('/', authenticate, SuggestionController.getSuggestions);

export default router; 