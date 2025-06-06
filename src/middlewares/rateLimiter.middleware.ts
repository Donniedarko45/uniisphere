import rateLimit from "express-rate-limit";
import { Request, Response } from "express";

// Extend Request interface to include userId
interface AuthenticatedRequest extends Request {
  userId?: string;
}

// Custom error handler for rate limit exceeded
const rateLimitHandler = (req: Request, res: Response) => {
  const resetTime = req.rateLimit?.resetTime;
  const retryAfter =
    resetTime instanceof Date
      ? Math.round((resetTime.getTime() - Date.now()) / 1000)
      : 0;

  res.status(429).json({
    success: false,
    message: "Too many requests. Please try again later.",
    retryAfter,
  });
};

// General API rate limiter - applies to all routes
export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // Limit each IP to 1000 requests per windowMs
  handler: rateLimitHandler,
});

// Strict rate limiter for authentication routes
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10 auth requests per windowMs
  skipSuccessfulRequests: true, // Don't count successful requests
  handler: rateLimitHandler,
});

// Password reset rate limiter
export const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // Limit each IP to 3 password reset requests per hour
  handler: rateLimitHandler,
});

// Email sending rate limiter (OTP, verification emails)
export const emailLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 3, // Limit each IP to 3 email requests per 5 minutes
  handler: rateLimitHandler,
});

// Post creation rate limiter
export const postLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 5, // Limit each IP to 5 posts per minute
  handler: rateLimitHandler,
});

// Story creation rate limiter
export const storyLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 10, // Limit each IP to 10 stories per 5 minutes
  handler: rateLimitHandler,
});

// Message sending rate limiter
export const messageLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30, // Limit each IP to 30 messages per minute
  handler: rateLimitHandler,
});

// Connection request rate limiter
export const connectionLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 20, // Limit each IP to 20 connection requests per 5 minutes
  handler: rateLimitHandler,
});

// File upload rate limiter
export const uploadLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // Limit each IP to 10 file uploads per minute
  handler: rateLimitHandler,
});

// Search rate limiter
export const searchLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 60, // Limit each IP to 60 search requests per minute
  handler: rateLimitHandler,
});

// Database intensive operations limiter
export const dbIntensiveLimiter = rateLimit({
  windowMs: 2 * 60 * 1000, // 2 minutes
  max: 50, // Limit each IP to 50 database intensive operations per 2 minutes
  handler: rateLimitHandler,
});

// User-specific rate limiter (for logged-in users)
export const createUserSpecificLimiter = (
  maxRequests: number,
  windowMs: number,
  message: string,
) => {
  return rateLimit({
    windowMs,
    max: maxRequests,
    keyGenerator: (req: AuthenticatedRequest) => {
      // Use user ID if authenticated, fallback to IP
      return req.userId || req.ip || "unknown";
    },
    handler: (req: Request, res: Response) => {
      res.status(429).json({
        success: false,
        message,
      });
    },
  });
};

// Export a function to create custom rate limiters
export const createCustomLimiter = (options: {
  windowMs: number;
  max: number;
  message: string;
  skipSuccessfulRequests?: boolean;
}) => {
  return rateLimit({
    windowMs: options.windowMs,
    max: options.max,
    skipSuccessfulRequests: options.skipSuccessfulRequests || false,
    handler: (req: Request, res: Response) => {
      res.status(429).json({
        success: false,
        message: options.message,
      });
    },
  });
};

