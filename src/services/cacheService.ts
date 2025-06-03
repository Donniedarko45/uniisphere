import redisManager from '../config/redis';

export class CacheService {
  private defaultTTL: number = 3600; // 1 hour default

  // User profile caching
  async cacheUserProfile(userId: string, profile: any, ttl: number = this.defaultTTL): Promise<void> {
    const key = `user_profile:${userId}`;
    await redisManager.setJson(key, profile, ttl);
  }

  async getUserProfile(userId: string): Promise<any | null> {
    const key = `user_profile:${userId}`;
    return await redisManager.getJson(key);
  }

  async invalidateUserProfile(userId: string): Promise<void> {
    const key = `user_profile:${userId}`;
    await redisManager.del(key);
  }

  // Post caching
  async cachePost(postId: string, post: any, ttl: number = this.defaultTTL): Promise<void> {
    const key = `post:${postId}`;
    await redisManager.setJson(key, post, ttl);
  }

  async getPost(postId: string): Promise<any | null> {
    const key = `post:${postId}`;
    return await redisManager.getJson(key);
  }

  async invalidatePost(postId: string): Promise<void> {
    const key = `post:${postId}`;
    await redisManager.del(key);
  }

  // User posts list caching
  async cacheUserPosts(userId: string, posts: any[], ttl: number = 1800): Promise<void> { // 30 minutes
    const key = `user_posts:${userId}`;
    await redisManager.setJson(key, posts, ttl);
  }

  async getUserPosts(userId: string): Promise<any[] | null> {
    const key = `user_posts:${userId}`;
    return await redisManager.getJson(key);
  }

  async invalidateUserPosts(userId: string): Promise<void> {
    const key = `user_posts:${userId}`;
    await redisManager.del(key);
  }

  // Connection caching
  async cacheUserConnections(userId: string, connections: any[], ttl: number = 1800): Promise<void> {
    const key = `user_connections:${userId}`;
    await redisManager.setJson(key, connections, ttl);
  }

  async getUserConnections(userId: string): Promise<any[] | null> {
    const key = `user_connections:${userId}`;
    return await redisManager.getJson(key);
  }

  async invalidateUserConnections(userId: string): Promise<void> {
    const key = `user_connections:${userId}`;
    await redisManager.del(key);
  }

  // Stories caching
  async cacheUserStories(userId: string, stories: any[], ttl: number = 900): Promise<void> { // 15 minutes
    const key = `user_stories:${userId}`;
    await redisManager.setJson(key, stories, ttl);
  }

  async getUserStories(userId: string): Promise<any[] | null> {
    const key = `user_stories:${userId}`;
    return await redisManager.getJson(key);
  }

  async invalidateUserStories(userId: string): Promise<void> {
    const key = `user_stories:${userId}`;
    await redisManager.del(key);
  }

  // Feed caching
  async cacheFeed(userId: string, feed: any[], ttl: number = 600): Promise<void> { // 10 minutes
    const key = `feed:${userId}`;
    await redisManager.setJson(key, feed, ttl);
  }

  async getFeed(userId: string): Promise<any[] | null> {
    const key = `feed:${userId}`;
    return await redisManager.getJson(key);
  }

  async invalidateFeed(userId: string): Promise<void> {
    const key = `feed:${userId}`;
    await redisManager.del(key);
  }

  // Search results caching
  async cacheSearchResults(query: string, results: any[], ttl: number = 1800): Promise<void> {
    const key = `search:${encodeURIComponent(query)}`;
    await redisManager.setJson(key, results, ttl);
  }

  async getSearchResults(query: string): Promise<any[] | null> {
    const key = `search:${encodeURIComponent(query)}`;
    return await redisManager.getJson(key);
  }

  // Session/authentication caching
  async cacheSession(sessionId: string, sessionData: any, ttl: number = 86400): Promise<void> { // 24 hours
    const key = `session:${sessionId}`;
    await redisManager.setJson(key, sessionData, ttl);
  }

  async getSession(sessionId: string): Promise<any | null> {
    const key = `session:${sessionId}`;
    return await redisManager.getJson(key);
  }

  async invalidateSession(sessionId: string): Promise<void> {
    const key = `session:${sessionId}`;
    await redisManager.del(key);
  }

  // Generic caching methods
  async cache(key: string, data: any, ttl: number = this.defaultTTL): Promise<void> {
    await redisManager.setJson(key, data, ttl);
  }

  async get<T>(key: string): Promise<T | null> {
    return await redisManager.getJson<T>(key);
  }

  async invalidate(key: string): Promise<void> {
    await redisManager.del(key);
  }

  async exists(key: string): Promise<boolean> {
    return await redisManager.exists(key);
  }

  // Bulk operations
  async invalidatePattern(pattern: string): Promise<void> {
    try {
      const client = await redisManager.getClient();
      if (!client) return;

      const keys = await client.keys(pattern);
      if (keys.length > 0) {
        await client.del(keys);
      }
    } catch (error) {
      console.error('Cache invalidate pattern error:', error);
    }
  }

  // Invalidate user-related caches when user data changes
  async invalidateUserData(userId: string): Promise<void> {
    await Promise.all([
      this.invalidateUserProfile(userId),
      this.invalidateUserPosts(userId),
      this.invalidateUserConnections(userId),
      this.invalidateUserStories(userId),
      this.invalidateFeed(userId)
    ]);
  }

  // Get cache statistics
  async getCacheStats(): Promise<{ connected: boolean; keyCount?: number }> {
    try {
      if (!redisManager.isClientConnected()) {
        return { connected: false };
      }

      const client = await redisManager.getClient();
      if (!client) return { connected: false };

      const info = await client.info('keyspace');
      const keyCount = info.includes('db0:keys=') 
        ? parseInt(info.split('db0:keys=')[1].split(',')[0]) 
        : 0;

      return { connected: true, keyCount };
    } catch (error) {
      console.error('Cache stats error:', error);
      return { connected: false };
    }
  }
}

// Export singleton instance
const cacheService = new CacheService();
export default cacheService; 