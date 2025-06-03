# Redis Setup and Caching Implementation Guide

## Installation

Install the required Redis packages:

```bash
npm install redis
```

## Redis Server Setup

### Local Development

1. **Install Redis Server**:
   ```bash
   # Ubuntu/Debian
   sudo apt update
   sudo apt install redis-server
   
   # macOS
   brew install redis
   
   # Windows (using WSL)
   sudo apt install redis-server
   ```

2. **Start Redis Server**:
   ```bash
   redis-server
   ```

3. **Test Redis Connection**:
   ```bash
   redis-cli ping
   # Should return: PONG
   ```

### Production Setup

For production, consider using:
- **Redis Cloud** (managed service)
- **AWS ElastiCache**
- **Google Cloud Memorystore**
- **Azure Cache for Redis**

## Environment Variables

Add to your `.env` file:

```env
# Redis Configuration
REDIS_URL=redis://localhost:6379
# For production with auth:
# REDIS_URL=redis://username:password@hostname:port
```

## Features Implemented

### 1. **Redis Manager** (`src/config/redis.ts`)
- Connection management with retry logic
- Automatic reconnection
- Error handling and fallback
- JSON serialization/deserialization
- TTL (Time To Live) support

### 2. **Cache Service** (`src/services/cacheService.ts`)
- User profile caching
- Post caching
- Connection data caching
- Stories caching
- Feed caching
- Search results caching
- Session caching
- Generic caching methods

### 3. **Rate Limiting with Memory Store**
- Uses in-memory storage (default express-rate-limit)
- Automatic cleanup and management
- Multiple rate limiters for different operations

## Caching Strategies

### User Profile Caching
```typescript
import cacheService from '../services/cacheService';

// Cache user profile
await cacheService.cacheUserProfile(userId, profile, 3600); // 1 hour

// Get cached profile
const cachedProfile = await cacheService.getUserProfile(userId);

// Invalidate when profile updates
await cacheService.invalidateUserProfile(userId);
```

### Post Caching
```typescript
// Cache individual post
await cacheService.cachePost(postId, post, 3600);

// Cache user's posts list
await cacheService.cacheUserPosts(userId, posts, 1800); // 30 minutes

// Invalidate when posts change
await cacheService.invalidateUserPosts(userId);
```

### Feed Caching
```typescript
// Cache user's feed
await cacheService.cacheFeed(userId, feedPosts, 600); // 10 minutes

// Get cached feed
const cachedFeed = await cacheService.getFeed(userId);
```

### Search Results Caching
```typescript
// Cache search results
await cacheService.cacheSearchResults(query, results, 1800);

// Get cached search results
const cachedResults = await cacheService.getSearchResults(query);
```

## Cache TTL (Time To Live) Strategy

| Data Type | TTL | Reason |
|-----------|-----|--------|
| User Profiles | 1 hour | Updates infrequently |
| Posts | 1 hour | Content rarely changes |
| User Posts List | 30 minutes | New posts added regularly |
| Connections | 30 minutes | Connections change moderately |
| Stories | 15 minutes | Time-sensitive content |
| Feed | 10 minutes | Needs to be fresh |
| Search Results | 30 minutes | Balance between performance and freshness |
| Sessions | 24 hours | Long-lived user sessions |

## Usage Examples

### In Controllers

```typescript
import cacheService from '../services/cacheService';

export const getProfile = async (req: Request, res: Response) => {
  const { userId } = req.params;
  
  // Try cache first
  let profile = await cacheService.getUserProfile(userId);
  
  if (!profile) {
    // Cache miss - fetch from database
    profile = await prisma.user.findUnique({
      where: { id: userId },
      include: { /* ... */ }
    });
    
    if (profile) {
      // Cache for future requests
      await cacheService.cacheUserProfile(userId, profile);
    }
  }
  
  res.json(profile);
};

export const updateProfile = async (req: Request, res: Response) => {
  const { userId } = req.params;
  
  // Update database
  const updatedProfile = await prisma.user.update({
    where: { id: userId },
    data: req.body
  });
  
  // Invalidate related caches
  await cacheService.invalidateUserData(userId);
  
  // Cache the updated profile
  await cacheService.cacheUserProfile(userId, updatedProfile);
  
  res.json(updatedProfile);
};
```

### Cache Invalidation Strategies

```typescript
// When user updates profile
await cacheService.invalidateUserData(userId); // Invalidates all user-related caches

// When user creates a post
await cacheService.invalidateUserPosts(userId);
await cacheService.invalidatePattern(`feed:*`); // Invalidate all feeds

// When user makes a connection
await cacheService.invalidateUserConnections(userId);
await cacheService.invalidateUserConnections(otherUserId);
```

## Monitoring and Statistics

```typescript
// Get cache statistics
const stats = await cacheService.getCacheStats();
console.log('Cache Status:', stats);
// Output: { connected: true, keyCount: 150 }
```

## Performance Benefits

1. **Faster Response Times**: Cached data retrieval is 10-100x faster than database queries
2. **Reduced Database Load**: Fewer queries to PostgreSQL
3. **Better Scalability**: Can handle more concurrent users
4. **Improved User Experience**: Faster page loads and API responses

## Error Handling

The Redis implementation includes comprehensive error handling:

- **Connection Failures**: Graceful fallback to database queries
- **Redis Unavailable**: Application continues to function normally
- **Timeout Handling**: Automatic retry with exponential backoff
- **Memory Management**: Automatic TTL cleanup

## Best Practices

### 1. Cache Keys
- Use consistent naming patterns: `user_profile:${userId}`
- Include versions for breaking changes: `user_profile:v2:${userId}`
- Use namespaces to avoid collisions

### 2. TTL Management
- Set appropriate TTLs based on data volatility
- Use shorter TTLs for frequently changing data
- Use longer TTLs for static/reference data

### 3. Cache Invalidation
- Invalidate caches when underlying data changes
- Use pattern-based invalidation for related data
- Consider cascading invalidation for dependent data

### 4. Monitoring
- Monitor cache hit/miss ratios
- Track Redis memory usage
- Set up alerts for Redis disconnections

## Production Considerations

1. **Memory Management**: Monitor Redis memory usage and set max memory limits
2. **Persistence**: Configure Redis persistence (RDB/AOF) for data durability
3. **Security**: Use Redis AUTH and network security
4. **Clustering**: Consider Redis Cluster for high availability
5. **Monitoring**: Use Redis monitoring tools like RedisInsight

## Installation Complete

Your application now has:
- ✅ Redis caching system
- ✅ Comprehensive cache service
- ✅ Error handling and fallbacks
- ✅ Rate limiting (memory-based)
- ✅ Automatic cleanup on shutdown

The caching system will significantly improve your application's performance and scalability. 