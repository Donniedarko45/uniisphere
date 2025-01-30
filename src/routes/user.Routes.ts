import { Router } from "express";
import { authenticate } from "../middlewares/auth.middleware";
import { updateProfile, getProfile } from "../controllers/user.controller";

const router = Router();

router.get("/updateprofile", authenticate, updateProfile);
router.get("/profile/:userId", getProfile);

export default router;
