import { Router } from 'express';
import { getIntro, getLoading } from '../controllers/connectController';
const router = Router();

router.get('/intro', getIntro);
router.get('/loading', getLoading);

export default router;