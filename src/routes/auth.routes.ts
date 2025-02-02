import { Router, RequestHandler } from "express";
import {
  login,
  register,
  googleAuth,
  verifyOtp,
} from "../controllers/auth.controller";

const router = Router();

router.post("/register", register);
router.post("/login", login);
router.post("/oauth/google", googleAuth);
router.post("/verifyOtp", verifyOtp);

export default router;
