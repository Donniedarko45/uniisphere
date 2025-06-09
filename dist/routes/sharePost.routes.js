"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const sharePost_controller_1 = require("../controllers/sharePost.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const router = express_1.default.Router();
// Share a post
router.post('/:postId', auth_middleware_1.authenticate, sharePost_controller_1.sharePost);
// Get user's shared posts
router.get('/my-shares', auth_middleware_1.authenticate, sharePost_controller_1.getSharedPosts);
// Unshare a post
router.delete('/:postId', auth_middleware_1.authenticate, sharePost_controller_1.unsharePost);
exports.default = router;
