import { Router } from "express";
import { getFeed } from "../controllers/feed.controller";
import { authenticate } from "../middlewares/auth.middleware";

const router = Router();

// Main feed routes
router.get("/feed", authenticate, getFeed); // General feed
router.get("/feed/trending", authenticate, getFeed); // Trending posts
router.get("/feed/network", authenticate, getFeed); // Only connection posts
router.get("/feed/recommended", authenticate, getFeed); // Posts based on interests
router.get("/feed/hashtag/:tag", authenticate, getFeed); // Posts by hashtag

export default router;
