"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_controller_1 = require("../controllers/auth.controller");
const rateLimiter_middleware_1 = require("../middlewares/rateLimiter.middleware");
const router = (0, express_1.Router)();
// Apply auth rate limiter to login and register
router.post("/register", rateLimiter_middleware_1.authLimiter, auth_controller_1.register);
router.post("/login", rateLimiter_middleware_1.authLimiter, auth_controller_1.login);
router.post("/verifyOtp", rateLimiter_middleware_1.authLimiter, auth_controller_1.verifyOtp);
router.post("/completeProfile", rateLimiter_middleware_1.authLimiter, auth_controller_1.completeProfile);
// Apply email rate limiter to email-sending endpoints
router.post("/resendOtp", rateLimiter_middleware_1.emailLimiter, auth_controller_1.resendOtp);
// Apply less restrictive limiter to OAuth routes
router.post("/oauth/google", auth_controller_1.googleAuth);
router.get('/google', auth_controller_1.googleAuth);
router.get('/google/callback', auth_controller_1.googleAuthCallback);
// Apply password reset rate limiter to password reset routes
router.post("/forgot-password", rateLimiter_middleware_1.passwordResetLimiter, auth_controller_1.forgotPassword);
router.post("/reset-password", rateLimiter_middleware_1.passwordResetLimiter, auth_controller_1.resetPassword);
exports.default = router;
