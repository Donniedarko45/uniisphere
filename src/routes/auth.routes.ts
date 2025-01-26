import { Router, RequestHandler } from "express";
import {
  login,
  otpLogin,
  register,
  googleAuth,
} from "../controllers/auth.controller";

const router = Router();

router.post("/register", register);
router.post("/login", login);
router.post("/otp-login", otpLogin);
router.post("/oauth/google", googleAuth);

export default router;
