import { Router } from "express";
import { clerkOauth, login, otpLogin, register } from "../controllers/auth.controller";

const router = Router();

// Public routes (no authentication needed)
router.post("/register", register);
router.post("/login", login);
router.post("/otp-login", otpLogin);
router.post("/oauth", clerkOauth);

export default router;
