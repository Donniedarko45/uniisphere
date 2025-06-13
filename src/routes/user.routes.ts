import { Router } from "express";
import {
  getAllUsers,
  getProfile,
  getTotalUsersExcludingExistingConnections,
  updateProfile,
  updateUserStatus,
} from "../controllers/user.controller";
import { authenticate } from "../middlewares/auth.middleware";
import { upload } from "../middlewares/upload.middleware";
import {
  searchLimiter,
  uploadLimiter,
  dbIntensiveLimiter,
} from "../middlewares/rateLimiter.middleware";

const router = Router();

// Get user profile - supports either userId or search param as query strings
// Apply search limiter since this can be used for searching users
router.get("/profile", getProfile);

// Update profile - needs authentication and potential file upload
router.patch(
  "/profile",
  authenticate,
  (req, res, next) => {
    // Only apply upload middleware if content-type indicates multipart data
    if (req.headers["content-type"]?.includes("multipart/form-data")) {
      return upload.single("profilePicture")(req, res, next);
    }
    next();
  },
  updateProfile,
);

// Get total users excluding existing connections
router.get("/usersWithoutConnections", authenticate, getTotalUsersExcludingExistingConnections);

// Get all users (database intensive operation)
router.get("/", getAllUsers);

// Get profile by userId as a URL parameter (alternative style)
router.get("/profile/:userId", async (req, res, next) => {
  req.query.userId = req.params.userId;
  return getProfile(req, res, next);
});

// Update user status
router.patch("/status", authenticate, updateUserStatus);

export default router;
