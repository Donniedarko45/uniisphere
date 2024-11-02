import { Router } from "express";
import express from "express";
import {
  clerkOauth,
  login,
  otpLogin,
  register,
} from "../controllers/auth.controller";

const app = express();
const router = Router();
app.use(express.urlencoded({ extended: true }));
router.post("/register", register);
router.post("/login", login);
router.post("/otp-login", otpLogin);
router.post("/oauth", clerkOauth);

export default router;
