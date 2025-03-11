import { Router } from "express";
import {
  completeProfile // Add this import
  ,
  googleAuth,
  googleAuthCallback,
  login,
  register,
  resendOtp,
  verifyOtp
} from "../controllers/auth.controller";

const router = Router();

router.post("/register", register);
router.post("/login", login);
router.post("/verifyOtp", verifyOtp);
router.post("/completeProfile", completeProfile); // Add new route
router.post("/resendOtp", resendOtp);
router.post("/oauth/google", googleAuth);
router.get('/google', googleAuth);
router.get('/google/callback', googleAuthCallback);

export default router;
