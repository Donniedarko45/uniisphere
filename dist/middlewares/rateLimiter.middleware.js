"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createCustomLimiter = exports.createUserSpecificLimiter = exports.dbIntensiveLimiter = exports.searchLimiter = exports.uploadLimiter = exports.connectionLimiter = exports.messageLimiter = exports.storyLimiter = exports.postLimiter = exports.emailLimiter = exports.passwordResetLimiter = exports.authLimiter = exports.generalLimiter = void 0;
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
// Custom error handler for rate limit exceeded
const rateLimitHandler = (req, res) => {
    var _a;
    const resetTime = (_a = req.rateLimit) === null || _a === void 0 ? void 0 : _a.resetTime;
    const retryAfter = resetTime instanceof Date
        ? Math.round((resetTime.getTime() - Date.now()) / 1000)
        : 0;
    res.status(429).json({
        success: false,
        message: "Too many requests. Please try again later.",
        retryAfter,
    });
};
// General API rate limiter - applies to all routes
exports.generalLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 1000, // Limit each IP to 1000 requests per windowMs
    handler: rateLimitHandler,
});
// Strict rate limiter for authentication routes
exports.authLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // Limit each IP to 10 auth requests per windowMs
    skipSuccessfulRequests: true, // Don't count successful requests
    handler: rateLimitHandler,
});
// Password reset rate limiter
exports.passwordResetLimiter = (0, express_rate_limit_1.default)({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 3, // Limit each IP to 3 password reset requests per hour
    handler: rateLimitHandler,
});
// Email sending rate limiter (OTP, verification emails)
exports.emailLimiter = (0, express_rate_limit_1.default)({
    windowMs: 5 * 60 * 1000, // 5 minutes
    max: 3, // Limit each IP to 3 email requests per 5 minutes
    handler: rateLimitHandler,
});
// Post creation rate limiter
exports.postLimiter = (0, express_rate_limit_1.default)({
    windowMs: 60 * 1000, // 1 minute
    max: 5, // Limit each IP to 5 posts per minute
    handler: rateLimitHandler,
});
// Story creation rate limiter
exports.storyLimiter = (0, express_rate_limit_1.default)({
    windowMs: 5 * 60 * 1000, // 5 minutes
    max: 10, // Limit each IP to 10 stories per 5 minutes
    handler: rateLimitHandler,
});
// Message sending rate limiter
exports.messageLimiter = (0, express_rate_limit_1.default)({
    windowMs: 60 * 1000, // 1 minute
    max: 30, // Limit each IP to 30 messages per minute
    handler: rateLimitHandler,
});
// Connection request rate limiter
exports.connectionLimiter = (0, express_rate_limit_1.default)({
    windowMs: 5 * 60 * 1000, // 5 minutes
    max: 20, // Limit each IP to 20 connection requests per 5 minutes
    handler: rateLimitHandler,
});
// File upload rate limiter
exports.uploadLimiter = (0, express_rate_limit_1.default)({
    windowMs: 60 * 1000, // 1 minute
    max: 10, // Limit each IP to 10 file uploads per minute
    handler: rateLimitHandler,
});
// Search rate limiter
exports.searchLimiter = (0, express_rate_limit_1.default)({
    windowMs: 60 * 1000, // 1 minute
    max: 60, // Limit each IP to 60 search requests per minute
    handler: rateLimitHandler,
});
// Database intensive operations limiter
exports.dbIntensiveLimiter = (0, express_rate_limit_1.default)({
    windowMs: 2 * 60 * 1000, // 2 minutes
    max: 50, // Limit each IP to 50 database intensive operations per 2 minutes
    handler: rateLimitHandler,
});
// User-specific rate limiter (for logged-in users)
const createUserSpecificLimiter = (maxRequests, windowMs, message) => {
    return (0, express_rate_limit_1.default)({
        windowMs,
        max: maxRequests,
        keyGenerator: (req) => {
            // Use user ID if authenticated, fallback to IP
            return req.userId || req.ip || "unknown";
        },
        handler: (req, res) => {
            res.status(429).json({
                success: false,
                message,
            });
        },
    });
};
exports.createUserSpecificLimiter = createUserSpecificLimiter;
// Export a function to create custom rate limiters
const createCustomLimiter = (options) => {
    return (0, express_rate_limit_1.default)({
        windowMs: options.windowMs,
        max: options.max,
        skipSuccessfulRequests: options.skipSuccessfulRequests || false,
        handler: (req, res) => {
            res.status(429).json({
                success: false,
                message: options.message,
            });
        },
    });
};
exports.createCustomLimiter = createCustomLimiter;
