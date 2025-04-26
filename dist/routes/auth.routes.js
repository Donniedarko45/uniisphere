"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_controller_1 = require("../controllers/auth.controller");
const router = (0, express_1.Router)();
router.post("/register", auth_controller_1.register);
router.post("/login", auth_controller_1.login);
router.post("/verifyOtp", auth_controller_1.verifyOtp);
router.post("/completeProfile", auth_controller_1.completeProfile);
router.post("/resendOtp", auth_controller_1.resendOtp);
router.post("/oauth/google", auth_controller_1.googleAuth);
router.get('/google', auth_controller_1.googleAuth);
router.get('/google/callback', auth_controller_1.googleAuthCallback);
// Add new password reset routes
router.post("/forgot-password", auth_controller_1.forgotPassword);
router.post("/reset-password", auth_controller_1.resetPassword);
exports.default = router;
