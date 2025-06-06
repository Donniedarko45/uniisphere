import express, { Router } from "express";
import {
  acceptConnection,
  declineConnection,
  getConnections,
  getConnectionStats,
  getPendingRequests,
  sendConnectionRequest,
} from "../controllers/connection.controller";
import { authenticate } from "../middlewares/auth.middleware";
import {
  connectionLimiter,
  dbIntensiveLimiter,
} from "../middlewares/rateLimiter.middleware";

const app = express();
const router = Router();

app.use(express.urlencoded({ extended: true }));

// Apply connection rate limiting to prevent spam
router.post("/connect/:userId", authenticate, sendConnectionRequest);
router.post("/accept/:connectionId", authenticate, acceptConnection);
router.post("/decline/:connectionId", authenticate, declineConnection);

// Apply database intensive limiter to routes that fetch multiple connections
router.post("/getPending/", authenticate, getPendingRequests);
router.get("/connections", authenticate, getConnections);
router.get("/stats/:userId", authenticate, getConnectionStats);

export default router;
