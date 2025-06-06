"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const story_controller_1 = require("../controllers/story.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const upload_middleware_1 = require("../middlewares/upload.middleware");
const rateLimiter_middleware_1 = require("../middlewares/rateLimiter.middleware");
const router = express_1.default.Router();
// Create a new story (supports both file upload and direct URL)
router.post("/", auth_middleware_1.authenticate, rateLimiter_middleware_1.storyLimiter, rateLimiter_middleware_1.uploadLimiter, upload_middleware_1.storyUpload.single("media"), story_controller_1.createStory);
// Get all stories from connected users (database intensive)
router.get("/", auth_middleware_1.authenticate, rateLimiter_middleware_1.dbIntensiveLimiter, story_controller_1.getStories);
// View a story
router.post("/:storyId/view", auth_middleware_1.authenticate, story_controller_1.viewStory);
// Delete a story
router.delete("/:id", auth_middleware_1.authenticate, story_controller_1.deleteStory);
exports.default = router;
