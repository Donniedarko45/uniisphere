import { Router, RequestHandler } from "express";
import {
  login,
  register,
  googleAuth,
  verifyOtp,
  resendOtp
} from "../controllers/auth.controller";

const router = Router();

router.post("/register", register);
router.post("/login", login);
router.post("/oauth/google", googleAuth);
router.post("/verifyOtp", verifyOtp);
router.post("/resendOtp", resendOtp); 

export default router;
