import { Router } from "express";
import { clerkOauth, login, otpLogin, register } from "../controllers/auth.controller";

const router = Router();

router.post("/register", register);
router.post("/login", login);
router.post("/otp-login", otpLogin);
router.post("/oauth", clerkOauth);

export default router;
