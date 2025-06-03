# 🚀 Uniisphere Documentation

## 📋 Table of Contents
1. [Project Overview](#project-overview)
2. [Tech Stack](#tech-stack)
3. [Setup & Installation](#setup--installation)
4. [Project Structure](#project-structure)
5. [Database Schema](#database-schema)
6. [Authentication System](#authentication-system)
7. [API Documentation](#api-documentation)
8. [File Upload System](#file-upload-system)
9. [Rate Limiting & Security](#rate-limiting--security)
10. [Caching with Redis](#caching-with-redis)
11. [Real-time Features](#real-time-features)
12. [Development Workflow](#development-workflow)
13. [Deployment](#deployment)
14. [Troubleshooting](#troubleshooting)

---

## 🎯 Project Overview

**Uniisphere** is a social networking platform similar to LinkedIn, designed for university students and professionals. It includes features like:

- User profiles with education/work experience
- Post creation and interactions (likes, comments)
- Stories (Instagram-style)
- Real-time messaging
- Connection system
- Human Library (anonymous chat)
- Blog system
- File sharing

---

## 🛠 Tech Stack

### Backend
- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: JWT tokens
- **File Storage**: Cloudinary
- **Cache**: Redis
- **Real-time**: Socket.io
- **Rate Limiting**: express-rate-limit

### Development Tools
- **TypeScript**: For type safety
- **Prisma**: Database ORM and migrations
- **Docker**: Containerization
- **ESLint**: Code linting

---

## 🚀 Setup & Installation

### Prerequisites
```bash
# Required software
- Node.js (v18+)
- PostgreSQL
- Redis
- Docker (optional)
```

### Environment Variables
Create `.env` file:
```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/uniisphere"

# JWT
JWT_SECRET="your-super-secret-jwt-key"

# Cloudinary
CLOUDINARY_CLOUD_NAME="your-cloud-name"
CLOUDINARY_API_KEY="your-api-key"
CLOUDINARY_API_SECRET="your-api-secret"

# Redis
REDIS_URL="redis://localhost:6379"

# Email (NodeMailer)
EMAIL_HOST="smtp.gmail.com"
EMAIL_PORT=587
EMAIL_USER="your-email@gmail.com"
EMAIL_PASS="your-app-password"

# Google OAuth
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# General
PORT=8000
NODE_ENV="development"
CORS_ORIGIN="http://localhost:3000"
CLIENT_URL="http://localhost:3000"
```

### Installation Steps
```bash
# 1. Clone and install dependencies
git clone <repository-url>
cd Uniisphere
npm install

# 2. Setup database
npx prisma migrate dev
npx prisma generate

# 3. Start Redis (if not using Docker)
redis-server

# 4. Start development server
npm run dev

# 5. Build for production
npm run build
npm start
```

---

## 📁 Project Structure

```
src/
├── config/
│   ├── prisma.ts          # Database connection
│   └── redis.ts           # Redis connection & manager
├── controllers/           # Route handlers
│   ├── auth.controller.ts
│   ├── user.controller.ts
│   ├── post.controller.ts
│   ├── story.controller.ts
│   ├── connection.controller.ts
│   ├── message.controller.ts
│   └── ...
├── middlewares/           # Express middlewares
│   ├── auth.middleware.ts
│   ├── upload.middleware.ts
│   └── rateLimiter.middleware.ts
├── routes/               # API routes
│   ├── auth.routes.ts
│   ├── user.routes.ts
│   └── ...
├── services/             # Business logic
│   ├── cacheService.ts
│   └── ...
├── utils/                # Helper functions
│   ├── cloudinary.ts
│   ├── jwt.utils.ts
│   └── socket.ts
├── types/                # TypeScript types
└── app.ts               # Main application file
```

---

## 🗄 Database Schema

### Key Models

#### User
```typescript
model User {
  id                String   @id @default(uuid())
  username          String?  @unique
  email             String   @unique
  firstName         String?
  lastName          String?
  profilePictureUrl String?
  location          String?
  About             String?
  Skills            String[]
  Interests         String[]
  headline          String[]
  college           String?
  degree            String?
  // ... relationships
  posts             Post[]
  connections1      Connection[] @relation("UserConnections1")
  connections2      Connection[] @relation("UserConnections2")
  experiences       Experience[]
}
```

#### Post
```typescript
model Post {
  id         String   @id @default(uuid())
  content    String
  mediaUrl   String[]
  userId     String
  visibility String   @default("public")
  tags       String[]
  location   String?
  createdAt  DateTime @default(now())
  // ... relationships
  user       User     @relation(fields: [userId], references: [id])
  Likes      Likes[]
  Comments   Comments[]
}
```

#### Connection
```typescript
model Connection {
  id        String   @id @default(uuid())
  userId1   String
  userId2   String
  status    String   @default("pending") // pending, accepted, declined
  createdAt DateTime @default(now())
  user1     User     @relation("UserConnections1", fields: [userId1], references: [id])
  user2     User     @relation("UserConnections2", fields: [userId2], references: [id])
}
```

---

## 🔐 Authentication System

### JWT Flow
1. User registers/logs in
2. Server generates JWT token
3. Client stores token (localStorage/cookies)
4. Client sends token in Authorization header: `Bearer <token>`

### Middleware Usage
```typescript
// Protected routes
router.get('/profile', authenticate, getProfile);
router.patch('/profile', authenticate, verifyUser, updateProfile);
```

### Google OAuth Integration
- Routes: `/api/auth/google` and `/api/auth/google/callback`
- Uses Passport.js strategy
- Automatic user creation/login

---

## 📡 API Documentation

### Authentication APIs

#### POST `/api/auth/register`
**Purpose**: Register new user
**Body**:
```json
{
  "email": "user@example.com",
  "password": "securePassword123!",
  "firstName": "John",
  "lastName": "Doe"
}
```
**Response**:
```json
{
  "message": "Registration successful. Please verify your email.",
  "needsVerification": true
}
```

#### POST `/api/auth/login`
**Purpose**: User login
**Body**:
```json
{
  "email": "user@example.com",
  "password": "securePassword123!"
}
```
**Response**:
```json
{
  "token": "jwt-token-here",
  "user": {
    "id": "user-id",
    "email": "user@example.com",
    "username": "johndoe"
  }
}
```

#### POST `/api/auth/verifyOtp`
**Purpose**: Verify email OTP
**Body**:
```json
{
  "email": "user@example.com",
  "otp": "123456"
}
```

### User APIs

#### GET `/api/users/profile`
**Purpose**: Get user profile(s) - supports search and connection-based visibility
**Query Parameters**:
- `userId`: Specific user ID
- `search`: Search term for username
**Headers**: `Authorization: Bearer <token>` (optional, affects what data is returned)

**Response** (Connected user):
```json
[{
  "id": "user-id",
  "username": "johndoe",
  "firstName": "John",
  "lastName": "Doe",
  "email": "user@example.com",
  "profilePictureUrl": "cloudinary-url",
  "About": "Software developer...",
  "Skills": ["JavaScript", "TypeScript"],
  "Interests": ["Programming", "Music"],
  "isConnected": true,
  "isOwnProfile": false
}]
```

**Response** (Non-connected user):
```json
[{
  "id": "user-id",
  "username": "johndoe",
  "firstName": "John",
  "lastName": "Doe",
  "profilePictureUrl": "cloudinary-url",
  "headline": ["Software Developer"],
  "workorProject": "Building web apps",
  "college": "University Name",
  "location": "City, Country",
  "isConnected": false,
  "isOwnProfile": false
}]
```

#### PATCH `/api/users/profile`
**Purpose**: Update user profile
**Headers**: `Authorization: Bearer <token>`
**Content-Type**: `multipart/form-data` (for file uploads) or `application/json`
**Body**:
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "About": "Updated bio...",
  "Skills": ["JavaScript", "Python"],
  "experiences": [
    {
      "title": "Software Developer",
      "organizationName": "Tech Corp",
      "location": "Remote",
      "locationType": "Remote",
      "description": "Built web applications..."
    }
  ]
}
```

### Post APIs

#### POST `/api/posts`
**Purpose**: Create new post
**Headers**: `Authorization: Bearer <token>`
**Content-Type**: `multipart/form-data`
**Body**:
```javascript
// FormData
const formData = new FormData();
formData.append('content', 'This is my post content');
formData.append('visibility', 'public'); // public, connections, private
formData.append('tags', 'javascript,coding,webdev');
formData.append('location', 'San Francisco, CA');
formData.append('media', fileObject1); // up to 5 files
formData.append('media', fileObject2);
```

#### GET `/api/posts/:postId`
**Purpose**: Get specific post
**Response**:
```json
{
  "id": "post-id",
  "content": "Post content here...",
  "mediaUrl": ["cloudinary-url1", "cloudinary-url2"],
  "tags": ["javascript", "coding"],
  "location": "San Francisco, CA",
  "visibility": "public",
  "createdAt": "2024-01-01T00:00:00Z",
  "user": {
    "username": "johndoe",
    "profilePictureUrl": "cloudinary-url"
  },
  "_count": {
    "Likes": 15,
    "Comments": 3
  }
}
```

#### POST `/api/posts/:postId/like`
**Purpose**: Like a post
**Headers**: `Authorization: Bearer <token>`

#### POST `/api/posts/:postId/comment`
**Purpose**: Add comment to post
**Headers**: `Authorization: Bearer <token>`
**Body**:
```json
{
  "content": "Great post!"
}
```

### Story APIs

#### POST `/api/stories`
**Purpose**: Create story
**Headers**: `Authorization: Bearer <token>`
**Content-Type**: `multipart/form-data`
**Body**:
```javascript
const formData = new FormData();
formData.append('media', fileObject); // image or video
formData.append('type', 'image'); // 'image' or 'video'
formData.append('duration', '8'); // seconds
```

#### GET `/api/stories`
**Purpose**: Get stories from connections
**Headers**: `Authorization: Bearer <token>`
**Response**:
```json
[
  {
    "user": {
      "id": "user-id",
      "username": "johndoe",
      "profilePictureUrl": "cloudinary-url"
    },
    "stories": [
      {
        "id": "story-id",
        "mediaUrl": "cloudinary-url",
        "type": "image",
        "duration": 8,
        "createdAt": "2024-01-01T00:00:00Z",
        "views": [{"userId": "viewer-id"}]
      }
    ]
  }
]
```

### Connection APIs

#### POST `/api/connections/connect/:userId`
**Purpose**: Send connection request
**Headers**: `Authorization: Bearer <token>`

#### POST `/api/connections/accept/:connectionId`
**Purpose**: Accept connection request
**Headers**: `Authorization: Bearer <token>`

#### GET `/api/connections/connections`
**Purpose**: Get user's connections
**Headers**: `Authorization: Bearer <token>`
**Response**:
```json
{
  "connections": [
    {
      "id": "connection-id",
      "status": "accepted",
      "createdAt": "2024-01-01T00:00:00Z",
      "otherUser": {
        "id": "user-id",
        "username": "johndoe",
        "profilePictureUrl": "cloudinary-url"
      }
    }
  ],
  "stats": {
    "totalConnections": 150,
    "followers": 75,
    "following": 75
  }
}
```

### Message APIs

#### POST `/api/messages`
**Purpose**: Send message
**Headers**: `Authorization: Bearer <token>`
**Body**:
```json
{
  "receiverId": "user-id",
  "content": "Hello! How are you?"
}
```

#### GET `/api/messages/conversation/:userId`
**Purpose**: Get conversation with specific user
**Headers**: `Authorization: Bearer <token>`

#### GET `/api/messages/conversations`
**Purpose**: Get all conversations
**Headers**: `Authorization: Bearer <token>`

---

## 📁 File Upload System

### Supported File Types
- **Images**: JPEG, JPG, PNG, GIF
- **Videos**: MP4, AVI, MOV, WMV, FLV, WEBM (stories only)
- **Size Limits**: 15MB (general), 50MB (stories)

### Upload Process
1. Files uploaded to `/public/temp` directory
2. Processed and uploaded to Cloudinary
3. URLs stored in database
4. Temporary files cleaned up

### File Upload Endpoints
- **Profile Pictures**: `PATCH /api/users/profile` with `profilePicture` field
- **Posts**: `POST /api/posts` with `media` field (up to 5 files)
- **Stories**: `POST /api/stories` with `media` field

---

## 🛡 Rate Limiting & Security

### Rate Limits Applied

| Endpoint Type | Limit | Window | Purpose |
|--------------|-------|---------|----------|
| General API | 1000 req | 15 min | Overall protection |
| Authentication | 10 req | 15 min | Brute force protection |
| Password Reset | 3 req | 1 hour | Reset abuse prevention |
| Email Sending | 3 req | 5 min | Email spam prevention |
| Post Creation | 5 req | 1 min | Content spam prevention |
| Messages | 30 req | 1 min | Message spam prevention |
| File Uploads | 10 req | 1 min | Upload abuse prevention |
| Search | 60 req | 1 min | Search abuse prevention |

### Security Features
- JWT token authentication
- Password hashing with bcrypt
- Input validation and sanitization
- CORS configuration
- File type validation
- SQL injection prevention (Prisma ORM)

---

## ⚡ Caching with Redis

### Cache Strategy
The application uses Redis for caching to improve performance:

#### Cached Data Types
- **User Profiles**: 1 hour TTL
- **Posts**: 1 hour TTL  
- **User Posts Lists**: 30 minutes TTL
- **Connections**: 30 minutes TTL
- **Stories**: 15 minutes TTL
- **Feeds**: 10 minutes TTL
- **Search Results**: 30 minutes TTL

#### Usage Example
```typescript
import cacheService from '../services/cacheService';

// Try cache first, fallback to database
let profile = await cacheService.getUserProfile(userId);
if (!profile) {
  profile = await prisma.user.findUnique({...});
  await cacheService.cacheUserProfile(userId, profile);
}
```

#### Cache Invalidation
- Automatic invalidation when data is updated
- Pattern-based invalidation for related data
- Manual invalidation methods available

---

## 🔄 Real-time Features

### Socket.io Implementation
- Real-time messaging
- Human Library (anonymous chat)
- Connection notifications
- Story view notifications

### Socket Events
```typescript
// Messaging
io.to(receiverId).emit('newMessage', messageData);

// Connections
io.to(userId).emit('connectionRequest', requestData);
io.to(userId).emit('connectionAccepted', acceptData);

// Human Library
io.to(roomId).emit('message', humanLibMessage);
```

---

## 💻 Development Workflow

### Code Structure Guidelines
1. **Controllers**: Handle HTTP requests/responses
2. **Services**: Business logic and data processing  
3. **Middlewares**: Authentication, validation, rate limiting
4. **Utils**: Helper functions and configurations

### Database Changes
```bash
# Create migration
npx prisma migrate dev --name migration-name

# Generate Prisma client
npx prisma generate

# Reset database (development only)
npx prisma migrate reset
```

### Testing API Endpoints
Use tools like Postman or curl:
```bash
# Login
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "password": "password123"}'

# Get profile (with token)
curl -X GET http://localhost:8000/api/users/profile?userId=user-id \
  -H "Authorization: Bearer your-jwt-token"
```

---

## 🚀 Deployment

### Docker Deployment
```bash
# Build image
docker build -t uniisphere-backend .

# Run container
docker run -p 8000:8000 --env-file .env uniisphere-backend
```

### Production Checklist
- [ ] Set `NODE_ENV=production`
- [ ] Configure production database
- [ ] Set up Redis (managed service recommended)
- [ ] Configure Cloudinary for production
- [ ] Set up proper CORS origins
- [ ] Configure email service
- [ ] Set up monitoring and logging
- [ ] Configure reverse proxy (Nginx)
- [ ] Set up SSL certificates
- [ ] Configure backup strategies

### Environment Variables for Production
```env
NODE_ENV=production
DATABASE_URL=production-database-url
REDIS_URL=production-redis-url
CORS_ORIGIN=https://yourdomain.com
CLIENT_URL=https://yourdomain.com
# ... other production values
```

---

## 🐛 Troubleshooting

### Common Issues

#### Database Connection Issues
```bash
# Check connection
npx prisma db pull

# Regenerate client
npx prisma generate
```

#### Redis Connection Issues
```bash
# Check Redis status
redis-cli ping

# Check Redis logs
redis-cli monitor
```

#### File Upload Issues
- Check Cloudinary credentials
- Verify file size limits
- Check temporary directory permissions

#### Authentication Issues
- Verify JWT secret is set
- Check token expiration
- Validate Google OAuth credentials

### Logs and Monitoring
- Application logs: `console.log/error` statements
- Redis logs: Monitor connection status
- Database logs: Prisma query logs
- File upload logs: Cloudinary upload status

---

## 📞 Important Notes

### API Response Format
All APIs follow consistent response format:
```json
// Success
{
  "success": true,
  "data": {...},
  "message": "Operation successful"
}

// Error  
{
  "success": false,
  "message": "Error description",
  "error": "Detailed error info"
}
```

### Connection Status Values
- `pending`: Request sent, waiting for response
- `accepted`: Connection established
- `declined`: Request declined

### Post Visibility Options
- `public`: Visible to everyone
- `connections`: Visible to connections only
- `private`: Visible to user only

### File Upload Notes
- Always use `multipart/form-data` for file uploads
- Multiple files: append multiple times with same field name
- File validation happens on server side

---

## 🎯 Next Steps for New Developer

1. **Setup Development Environment**: Follow setup instructions
2. **Run Database Migrations**: Ensure database is up to date
3. **Test API Endpoints**: Use Postman collection or curl commands
4. **Review Code Structure**: Understand the project organization
5. **Check Recent Changes**: Review Git history for recent updates
6. **Test File Uploads**: Verify Cloudinary integration
7. **Test Real-time Features**: Check Socket.io functionality
8. **Review Rate Limiting**: Understand security measures
9. **Test Redis Caching**: Verify caching functionality
10. **Study Business Logic**: Understand user flow and features

---

## 📚 Additional Resources

- **Prisma Documentation**: https://www.prisma.io/docs/
- **Express.js Guide**: https://expressjs.com/
- **Socket.io Documentation**: https://socket.io/docs/
- **Redis Documentation**: https://redis.io/documentation
- **Cloudinary API**: https://cloudinary.com/documentation

