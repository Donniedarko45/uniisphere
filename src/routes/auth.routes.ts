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
  verifyOtp,
} from "../controllers/auth.controller";
import {
  authLimiter,
  emailLimiter,
  passwordResetLimiter,
} from "../middlewares/rateLimiter.middleware";

const router = Router();

// Apply auth rate limiter to login and register
router.post("/register", register);
router.post("/login", login);
router.post("/verifyOtp", verifyOtp);
router.post("/completeProfile", completeProfile);

// Apply email rate limiter to email-sending endpoints
router.post("/resendOtp", resendOtp);

// Apply less restrictive limiter to OAuth routes
router.post("/oauth/google", googleAuth);
router.get("/google", googleAuth);
router.get("/google/callback", googleAuthCallback);

// Apply password reset rate limiter to password reset routes
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);

export default router;
