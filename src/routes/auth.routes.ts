import { Router, RequestHandler } from "express";
import {
  login,
  register,
  googleAuth,
  googleAuthCallback,
  verifyOtp,
  resendOtp
} from "../controllers/auth.controller";

const router = Router();

router.post("/register", register);
router.post("/login", login);
router.post("/oauth/google", googleAuth);
router.post("/verifyOtp", verifyOtp);
router.post("/resendOtp", resendOtp); 

router.get('/google', googleAuth);
router.get('/google/callback', googleAuthCallback);

export default router;
