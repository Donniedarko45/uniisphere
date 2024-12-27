import express from "express";
import { Router } from "express";
import { acceptConnection, declineConnection, getConnections, sendConnectionRequest } from "../controllers/connection.controller";
import { authenticate } from "../middlewares/auth.middleware";


const app = express();
const router = Router();


app.use(express.urlencoded({ extended: true }));


router.post("/connect/:userId", authenticate, sendConnectionRequest);
router.post('/accept/:connectionId', authenticate, acceptConnection);
router.post('/decline/:connectionId', authenticate, declineConnection);
router.get('/connections', authenticate, getConnections);

export default router;