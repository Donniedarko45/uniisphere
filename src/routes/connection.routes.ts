import express from "express";
import { Router } from "express";
import { sendConnectionRequest } from "../controllers/connection.controller";
import { authenticate } from "../middlewares/auth.middleware";

const app = express();
const router = Router();
app.use(express.urlencoded({ extended: true }));
//@ts-ignore
router.post("/connect/:userId", authenticate, sendConnectionRequest);
