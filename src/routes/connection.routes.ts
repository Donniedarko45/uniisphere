import express, { Router } from "express";
import {
	acceptConnection,
	declineConnection,
	getConnections,
	getConnectionStats,
	sendConnectionRequest
} from "../controllers/connection.controller";
import { authenticate } from "../middlewares/auth.middleware";

const app = express();
const router = Router();

app.use(express.urlencoded({ extended: true }));

router.post("/connect/:userId", authenticate, sendConnectionRequest);
router.post('/accept/:connectionId', authenticate, acceptConnection);
router.post('/decline/:connectionId', authenticate, declineConnection);
router.get('/connections', authenticate, getConnections);
router.get('/stats/:userId', authenticate, getConnectionStats); // New endpoint

export default router;
