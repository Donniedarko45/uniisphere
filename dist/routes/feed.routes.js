"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const feed_controller_1 = require("../controllers/feed.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const router = (0, express_1.Router)();
// Main feed routes
router.get("/feed", auth_middleware_1.authenticate, feed_controller_1.getFeed); // General feed
router.get("/feed/trending", auth_middleware_1.authenticate, feed_controller_1.getFeed); // Trending posts
router.get("/feed/network", auth_middleware_1.authenticate, feed_controller_1.getFeed); // Only connection posts
router.get("/feed/recommended", auth_middleware_1.authenticate, feed_controller_1.getFeed); // Posts based on interests
router.get("/feed/hashtag/:tag", auth_middleware_1.authenticate, feed_controller_1.getFeed); // Posts by hashtag
exports.default = router;
