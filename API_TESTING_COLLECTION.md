# 🧪 API Testing Collection - Uniisphere

## Quick Setup for Testing

### Base URL
```
Development: http://localhost:8000/api
Production: https://yourdomain.com/api
```

### Common Headers
```json
{
  "Content-Type": "application/json",
  "Authorization": "Bearer YOUR_JWT_TOKEN_HERE"
}
```

---

## 🔐 Authentication Endpoints

### 1. Register User
```bash
POST /auth/register
Content-Type: application/json

{
  "email": "newuser@example.com",
  "password": "SecurePassword123!",
  "firstName": "John",
  "lastName": "Doe"
}
```

### 2. Login User
```bash
POST /auth/login
Content-Type: application/json

{
  "email": "user@example.com", 
  "password": "SecurePassword123!"
}
```

### 3. Verify OTP
```bash
POST /auth/verifyOtp
Content-Type: application/json

{
  "email": "user@example.com",
  "otp": "123456"
}
```

### 4. Google OAuth Login
```bash
GET /auth/google
# Redirects to Google OAuth page
```

### 5. Forgot Password
```bash
POST /auth/forgotPassword
Content-Type: application/json

{
  "email": "user@example.com"
}
```

### 6. Reset Password
```bash
POST /auth/resetPassword
Content-Type: application/json

{
  "token": "reset-token-here",
  "newPassword": "NewSecurePassword123!"
}
```

---

## 👤 User Profile Endpoints

### 1. Get User Profile(s)
```bash
# Get specific user
GET /users/profile?userId=user-id-here
Authorization: Bearer YOUR_TOKEN

# Search users
GET /users/profile?search=john
Authorization: Bearer YOUR_TOKEN

# Get all users (limited info)
GET /users/profile
Authorization: Bearer YOUR_TOKEN
```

### 2. Update Profile (JSON)
```bash
PATCH /users/profile
Authorization: Bearer YOUR_TOKEN
Content-Type: application/json

{
  "firstName": "John",
  "lastName": "Doe",
  "About": "Software Developer passionate about technology",
  "Skills": ["JavaScript", "TypeScript", "React", "Node.js"],
  "Interests": ["Programming", "Music", "Travel"],
  "headline": ["Full Stack Developer"],
  "college": "University of Technology",
  "degree": "Computer Science",
  "location": "San Francisco, CA",
  "workorProject": "Building innovative web applications"
}
```

### 3. Update Profile with File Upload
```bash
PATCH /users/profile
Authorization: Bearer YOUR_TOKEN
Content-Type: multipart/form-data

# Form Data:
firstName: John
lastName: Doe
About: Software Developer...
Skills: ["JavaScript", "Python"]
profilePicture: [FILE]
```

### 4. Add Work Experience
```bash
POST /users/experience
Authorization: Bearer YOUR_TOKEN
Content-Type: application/json

{
  "title": "Senior Software Developer",
  "organizationName": "Tech Corp Inc",
  "location": "San Francisco, CA",
  "locationType": "Remote",
  "startDate": "2023-01-01T00:00:00Z",
  "endDate": "2024-01-01T00:00:00Z",
  "description": "Led development of web applications using React and Node.js",
  "currentlyWorking": false,
  "experienceType": "work"
}
```

---

## 📝 Post Endpoints

### 1. Create Post (Text Only)
```bash
POST /posts
Authorization: Bearer YOUR_TOKEN
Content-Type: application/json

{
  "content": "Just finished building an amazing web application! 🚀",
  "visibility": "public",
  "tags": ["javascript", "coding", "webdev"],
  "location": "San Francisco, CA"
}
```

### 2. Create Post with Media
```bash
POST /posts
Authorization: Bearer YOUR_TOKEN
Content-Type: multipart/form-data

# Form Data:
content: Check out these amazing photos from my project!
visibility: public
tags: javascript,coding,photos
location: San Francisco, CA
media: [FILE1]
media: [FILE2]
media: [FILE3]
```

### 3. Get Specific Post
```bash
GET /posts/POST_ID_HERE
Authorization: Bearer YOUR_TOKEN
```

### 4. Get User's Posts
```bash
GET /posts/user/USER_ID_HERE
Authorization: Bearer YOUR_TOKEN
```

### 5. Get Feed
```bash
GET /posts/feed
Authorization: Bearer YOUR_TOKEN
```

### 6. Like Post
```bash
POST /posts/POST_ID_HERE/like
Authorization: Bearer YOUR_TOKEN
```

### 7. Unlike Post
```bash
DELETE /posts/POST_ID_HERE/like  
Authorization: Bearer YOUR_TOKEN
```

### 8. Add Comment
```bash
POST /posts/POST_ID_HERE/comment
Authorization: Bearer YOUR_TOKEN
Content-Type: application/json

{
  "content": "Great post! Thanks for sharing."
}
```

### 9. Delete Post
```bash
DELETE /posts/POST_ID_HERE
Authorization: Bearer YOUR_TOKEN
```

---

## 📸 Story Endpoints

### 1. Create Story with File Upload
```bash
POST /stories
Authorization: Bearer YOUR_TOKEN
Content-Type: multipart/form-data

# Form Data:
media: [IMAGE_OR_VIDEO_FILE]
type: image
duration: 8
```

### 2. Create Story with URL
```bash
POST /stories
Authorization: Bearer YOUR_TOKEN
Content-Type: application/json

{
  "mediaUrl": "https://example.com/image.jpg",
  "type": "image", 
  "duration": 8
}
```

### 3. Get Stories
```bash
GET /stories
Authorization: Bearer YOUR_TOKEN
```

### 4. View Story
```bash
POST /stories/STORY_ID_HERE/view
Authorization: Bearer YOUR_TOKEN
```

### 5. Delete Story
```bash
DELETE /stories/STORY_ID_HERE
Authorization: Bearer YOUR_TOKEN
```

---

## 🤝 Connection Endpoints

### 1. Send Connection Request
```bash
POST /connections/connect/USER_ID_HERE
Authorization: Bearer YOUR_TOKEN
```

### 2. Get Pending Requests
```bash
GET /connections/pending
Authorization: Bearer YOUR_TOKEN
```

### 3. Accept Connection
```bash
POST /connections/accept/CONNECTION_ID_HERE
Authorization: Bearer YOUR_TOKEN
```

### 4. Decline Connection
```bash
POST /connections/decline/CONNECTION_ID_HERE
Authorization: Bearer YOUR_TOKEN
```

### 5. Get User Connections
```bash
GET /connections/connections
Authorization: Bearer YOUR_TOKEN
```

### 6. Remove Connection
```bash
DELETE /connections/CONNECTION_ID_HERE
Authorization: Bearer YOUR_TOKEN
```

---

## 💬 Message Endpoints

### 1. Send Message
```bash
POST /messages
Authorization: Bearer YOUR_TOKEN
Content-Type: application/json

{
  "receiverId": "USER_ID_HERE",
  "content": "Hello! How are you doing?"
}
```

### 2. Get Conversation
```bash
GET /messages/conversation/USER_ID_HERE
Authorization: Bearer YOUR_TOKEN
```

### 3. Get All Conversations
```bash
GET /messages/conversations
Authorization: Bearer YOUR_TOKEN
```

### 4. Mark Messages as Read
```bash
PATCH /messages/read
Authorization: Bearer YOUR_TOKEN
Content-Type: application/json

{
  "conversationUserId": "USER_ID_HERE"
}
```

---

## 🔍 Search Endpoints

### 1. Search Users
```bash
GET /users/profile?search=john
Authorization: Bearer YOUR_TOKEN
```

### 2. Search Posts
```bash
GET /posts/search?query=javascript&tags=coding,webdev
Authorization: Bearer YOUR_TOKEN
```

---

## 📁 File Upload Examples

### Profile Picture Upload
```javascript
const formData = new FormData();
formData.append('profilePicture', fileInput.files[0]);
formData.append('firstName', 'John');

fetch('/api/users/profile', {
  method: 'PATCH',
  headers: {
    'Authorization': 'Bearer ' + token
  },
  body: formData
});
```

### Post with Multiple Images
```javascript
const formData = new FormData();
formData.append('content', 'Check out these photos!');
formData.append('visibility', 'public');

// Add multiple files
for (let i = 0; i < files.length; i++) {
  formData.append('media', files[i]);
}

fetch('/api/posts', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer ' + token
  },
  body: formData
});
```

---

## 🧪 Complete Testing Workflow

### 1. Setup New User
```bash
# Register
POST /auth/register
{
  "email": "testuser@example.com",
  "password": "TestPassword123!",
  "firstName": "Test",
  "lastName": "User"
}

# Verify (if OTP required)
POST /auth/verifyOtp
{
  "email": "testuser@example.com", 
  "otp": "123456"
}

# Login
POST /auth/login
{
  "email": "testuser@example.com",
  "password": "TestPassword123!"
}

# Save the token from response!
```

### 2. Setup Profile
```bash
# Update profile
PATCH /users/profile
{
  "firstName": "Test",
  "lastName": "User", 
  "About": "Test user for API testing",
  "Skills": ["Testing", "API"],
  "college": "Test University"
}
```

### 3. Create Content
```bash
# Create a post
POST /posts
{
  "content": "My first test post!",
  "visibility": "public"
}

# Create a story
POST /stories
# Upload a test image file
```

### 4. Test Connections
```bash
# Connect with another user
POST /connections/connect/OTHER_USER_ID

# Accept connection (from other user)
POST /connections/accept/CONNECTION_ID
```

### 5. Test Messaging
```bash
# Send message
POST /messages
{
  "receiverId": "CONNECTED_USER_ID",
  "content": "Hello from API test!"
}
```

---

## 🚨 Error Handling Examples

### Common Error Responses

#### 401 Unauthorized
```json
{
  "success": false,
  "message": "Unauthorized - Please login"
}
```

#### 400 Bad Request
```json
{
  "success": false,
  "message": "Validation error",
  "errors": {
    "email": "Invalid email format",
    "password": "Password must be at least 8 characters"
  }
}
```

#### 429 Rate Limited
```json
{
  "success": false,
  "message": "Too many requests. Please try again later.",
  "retryAfter": 300
}
```

#### 500 Server Error
```json
{
  "success": false,
  "message": "Internal server error"
}
```

---

## 🛠 cURL Examples

### Login and Save Token
```bash
# Login and extract token
TOKEN=$(curl -s -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}' | \
  jq -r '.token')

# Use token in subsequent requests
curl -X GET http://localhost:8000/api/users/profile \
  -H "Authorization: Bearer $TOKEN"
```

### Create Post with File
```bash
curl -X POST http://localhost:8000/api/posts \
  -H "Authorization: Bearer $TOKEN" \
  -F "content=Test post with image" \
  -F "visibility=public" \
  -F "media=@/path/to/image.jpg"
```

---

## 📊 Testing Checklist

### Authentication Flow
- [ ] Register new user
- [ ] Verify email (if required)
- [ ] Login with correct credentials
- [ ] Login with wrong credentials (should fail)
- [ ] Access protected route without token (should fail)
- [ ] Access protected route with expired token (should fail)

### Profile Management
- [ ] Get own profile
- [ ] Update profile information
- [ ] Upload profile picture
- [ ] Add work experience
- [ ] View other user's profile

### Posts & Stories
- [ ] Create text post
- [ ] Create post with images
- [ ] Create story
- [ ] Like/unlike posts
- [ ] Comment on posts
- [ ] Delete own posts

### Connections
- [ ] Send connection request
- [ ] Accept connection request
- [ ] Decline connection request
- [ ] View connections list

### Messaging
- [ ] Send message to connected user
- [ ] Receive messages
- [ ] Mark messages as read

### File Uploads
- [ ] Upload profile picture
- [ ] Upload post images
- [ ] Upload story media
- [ ] Test file size limits
- [ ] Test invalid file types

### Rate Limiting
- [ ] Trigger rate limits on auth endpoints
- [ ] Verify rate limit headers
- [ ] Test rate limit reset

---

**💡 Pro Tips:**
1. Use Postman or Insomnia for easier API testing
2. Save your JWT token in environment variables
3. Test with different user roles and permissions
4. Always test error scenarios
5. Verify file uploads work correctly
6. Test rate limiting behavior
7. Check real-time features with socket connections 
