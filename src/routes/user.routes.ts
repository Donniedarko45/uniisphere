import { Router } from "express";
import { getAllUsers, getProfile, updateProfile, updateUserStatus } from "../controllers/user.controller";
import { authenticate } from "../middlewares/auth.middleware";
import { upload } from "../middlewares/upload.middleware";

const router = Router();

// Get user profile - supports either userId or search param as query strings
router.get("/profile", getProfile);

// Update profile - needs authentication and potential file upload
router.patch(
  "/profile",
  authenticate,
  upload.single("profilePicture"),
  updateProfile
);

router.get("/getAll", getAllUsers)

// Get profile by userId as a URL parameter (alternative style)
router.get("/profile/:userId", async (req, res, next) => {
  req.query.userId = req.params.userId;
  return getProfile(req, res, next);
});

// Update user status
router.patch('/status', authenticate, updateUserStatus);

export default router;
