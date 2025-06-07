"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const user_controller_1 = require("../controllers/user.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const upload_middleware_1 = require("../middlewares/upload.middleware");
const rateLimiter_middleware_1 = require("../middlewares/rateLimiter.middleware");
const router = (0, express_1.Router)();
// Get user profile - supports either userId or search param as query strings
// Apply search limiter since this can be used for searching users
router.get("/profile", user_controller_1.getProfile);
// Update profile - needs authentication and potential file upload
router.patch("/profile", auth_middleware_1.authenticate, rateLimiter_middleware_1.uploadLimiter, upload_middleware_1.upload.single("profilePicture"), user_controller_1.updateProfile);
// Get all users (database intensive operation)
router.get("/", user_controller_1.getAllUsers);
// Get profile by userId as a URL parameter (alternative style)
router.get("/profile/:userId", (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    req.query.userId = req.params.userId;
    return (0, user_controller_1.getProfile)(req, res, next);
}));
// Update user status
router.patch("/status", auth_middleware_1.authenticate, user_controller_1.updateUserStatus);
exports.default = router;
