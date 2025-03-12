import { Router } from "express";
import {
  completeProfile,
  forgotPassword,
  googleAuth,
  googleAuthCallback,
  login,
  register,
  resendOtp,
  resetPassword,
  verifyOtp
} from "../controllers/auth.controller";

const router = Router();

router.post("/register", register);
router.post("/login", login);
router.post("/verifyOtp", verifyOtp);
router.post("/completeProfile", completeProfile);
router.post("/resendOtp", resendOtp);
router.post("/oauth/google", googleAuth);
router.get('/google', googleAuth);
router.get('/google/callback', googleAuthCallback);

// Add new password reset routes
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);

export default router;
