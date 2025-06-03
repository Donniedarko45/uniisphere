# Rate Limiting Implementation Guide

## Installation

First, install the required package:

```bash
npm install express-rate-limit
```

## Overview

I've implemented a comprehensive rate limiting system to protect your API from abuse and attacks. The system includes multiple specialized rate limiters for different types of operations.

## Rate Limiters Implemented

### 1. **General Limiter** (Applied to all routes)
- **Limit**: 1000 requests per 15 minutes per IP
- **Purpose**: Prevent general API abuse
- **Applied**: Globally to all routes

### 2. **Authentication Limiter**
- **Limit**: 10 requests per 15 minutes per IP
- **Purpose**: Prevent brute force attacks on login/register
- **Applied**: Login, register, verify OTP, complete profile
- **Special**: Doesn't count successful requests

### 3. **Password Reset Limiter**
- **Limit**: 3 requests per hour per IP
- **Purpose**: Prevent password reset abuse
- **Applied**: Forgot password, reset password routes

### 4. **Email Limiter**
- **Limit**: 3 requests per 5 minutes per IP
- **Purpose**: Prevent email spam (OTP, verification emails)
- **Applied**: Resend OTP, email verification routes

### 5. **Post Creation Limiter**
- **Limit**: 5 posts per minute per IP
- **Purpose**: Prevent post spam
- **Applied**: Create post, create comment routes

### 6. **Story Creation Limiter**
- **Limit**: 10 stories per 5 minutes per IP
- **Purpose**: Prevent story spam
- **Applied**: Create story route

### 7. **Message Limiter**
- **Limit**: 30 messages per minute per IP
- **Purpose**: Prevent message spam
- **Applied**: Send message route

### 8. **Connection Limiter**
- **Limit**: 20 connection requests per 5 minutes per IP
- **Purpose**: Prevent connection spam
- **Applied**: Send connection request route

### 9. **Upload Limiter**
- **Limit**: 10 file uploads per minute per IP
- **Purpose**: Prevent upload abuse
- **Applied**: All file upload routes

### 10. **Search Limiter**
- **Limit**: 60 search requests per minute per IP
- **Purpose**: Prevent search abuse
- **Applied**: User profile search routes

### 11. **Database Intensive Limiter**
- **Limit**: 50 requests per 2 minutes per IP
- **Purpose**: Prevent database overload
- **Applied**: Routes that query multiple records

## Error Response Format

When rate limit is exceeded, the API returns:

```json
{
  "success": false,
  "message": "Too many requests. Please try again later.",
  "retryAfter": 900
}
```

## Response Headers

The system adds rate limit headers to responses:
- `RateLimit-Limit`: Maximum number of requests
- `RateLimit-Remaining`: Number of requests remaining
- `RateLimit-Reset`: Time when the rate limit resets

## Routes Protected

### Authentication Routes (`/api/auth`)
- `POST /register` - Auth Limiter
- `POST /login` - Auth Limiter
- `POST /verifyOtp` - Auth Limiter
- `POST /completeProfile` - Auth Limiter
- `POST /resendOtp` - Email Limiter
- `POST /forgot-password` - Password Reset Limiter
- `POST /reset-password` - Password Reset Limiter

### Post Routes (`/api/posts`)
- `POST /` - Post Limiter + Upload Limiter
- `GET /user/:userId` - DB Intensive Limiter
- `GET /total` - DB Intensive Limiter
- `POST /:postId/comment` - Post Limiter

### Story Routes (`/api/stories`)
- `POST /` - Story Limiter + Upload Limiter
- `GET /` - DB Intensive Limiter

### Connection Routes (`/api/connections`)
- `POST /connect/:userId` - Connection Limiter
- `POST /getPending/` - DB Intensive Limiter
- `GET /connections` - DB Intensive Limiter

### User Routes (`/api/users`)
- `GET /profile` - Search Limiter
- `PATCH /profile` - Upload Limiter
- `GET /` - DB Intensive Limiter

### Message Routes (`/api/messages`)
- `POST /` - Message Limiter
- `GET /conversation/:userId` - DB Intensive Limiter
- `GET /conversations` - DB Intensive Limiter

## Customization

You can create custom rate limiters using the provided functions:

```typescript
import { createCustomLimiter, createUserSpecificLimiter } from "./middlewares/rateLimiter.middleware";

// Custom limiter
const customLimiter = createCustomLimiter({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // 10 requests
  message: "Custom rate limit message"
});

// User-specific limiter (uses user ID instead of IP)
const userLimiter = createUserSpecificLimiter(
  5, // max requests
  60 * 1000, // window in ms
  "Too many requests per user"
);
```

## Security Benefits

1. **Prevents Brute Force Attacks**: Auth limiter stops password guessing
2. **Prevents Spam**: Post, message, and connection limiters prevent spam
3. **Prevents DoS**: General and DB intensive limiters prevent overload
4. **Prevents Abuse**: Upload and email limiters prevent resource abuse
5. **Rate Limit Headers**: Helps legitimate clients implement proper retry logic

## Monitoring

The rate limiting system automatically logs when limits are exceeded. You can monitor these logs to identify potential attacks or adjust limits as needed.

## Production Considerations

1. **Redis Store**: For production, consider using a Redis store instead of in-memory storage
2. **Proxy Trust**: Configure `trust proxy` if behind a reverse proxy
3. **IP Whitelisting**: Consider whitelisting trusted IPs
4. **Dynamic Limits**: Implement user-tier based limits (premium users get higher limits)

## Installation Complete

Your API is now protected against common attacks and abuse patterns. The rate limiting is applied automatically to all specified routes. 