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
import { 
  authLimiter, 
  emailLimiter, 
  passwordResetLimiter 
} from "../middlewares/rateLimiter.middleware";

const router = Router();

// Apply auth rate limiter to login and register
router.post("/register", authLimiter, register);
router.post("/login", authLimiter, login);
router.post("/verifyOtp", authLimiter, verifyOtp);
router.post("/completeProfile", authLimiter, completeProfile);

// Apply email rate limiter to email-sending endpoints
router.post("/resendOtp", emailLimiter, resendOtp);

// Apply less restrictive limiter to OAuth routes
router.post("/oauth/google", googleAuth);
router.get('/google', googleAuth);
router.get('/google/callback', googleAuthCallback);

// Apply password reset rate limiter to password reset routes
router.post("/forgot-password", passwordResetLimiter, forgotPassword);
router.post("/reset-password", passwordResetLimiter, resetPassword);

export default router;
