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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CacheService = void 0;
const redis_1 = __importDefault(require("../config/redis"));
class CacheService {
    constructor() {
        this.defaultTTL = 3600; // 1 hour default
    }
    // User profile caching
    cacheUserProfile(userId_1, profile_1) {
        return __awaiter(this, arguments, void 0, function* (userId, profile, ttl = this.defaultTTL) {
            const key = `user_profile:${userId}`;
            yield redis_1.default.setJson(key, profile, ttl);
        });
    }
    getUserProfile(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            const key = `user_profile:${userId}`;
            return yield redis_1.default.getJson(key);
        });
    }
    invalidateUserProfile(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            const key = `user_profile:${userId}`;
            yield redis_1.default.del(key);
        });
    }
    // Post caching
    cachePost(postId_1, post_1) {
        return __awaiter(this, arguments, void 0, function* (postId, post, ttl = this.defaultTTL) {
            const key = `post:${postId}`;
            yield redis_1.default.setJson(key, post, ttl);
        });
    }
    getPost(postId) {
        return __awaiter(this, void 0, void 0, function* () {
            const key = `post:${postId}`;
            return yield redis_1.default.getJson(key);
        });
    }
    invalidatePost(postId) {
        return __awaiter(this, void 0, void 0, function* () {
            const key = `post:${postId}`;
            yield redis_1.default.del(key);
        });
    }
    // User posts list caching
    cacheUserPosts(userId_1, posts_1) {
        return __awaiter(this, arguments, void 0, function* (userId, posts, ttl = 1800) {
            const key = `user_posts:${userId}`;
            yield redis_1.default.setJson(key, posts, ttl);
        });
    }
    getUserPosts(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            const key = `user_posts:${userId}`;
            return yield redis_1.default.getJson(key);
        });
    }
    invalidateUserPosts(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            const key = `user_posts:${userId}`;
            yield redis_1.default.del(key);
        });
    }
    // Connection caching
    cacheUserConnections(userId_1, connections_1) {
        return __awaiter(this, arguments, void 0, function* (userId, connections, ttl = 1800) {
            const key = `user_connections:${userId}`;
            yield redis_1.default.setJson(key, connections, ttl);
        });
    }
    getUserConnections(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            const key = `user_connections:${userId}`;
            return yield redis_1.default.getJson(key);
        });
    }
    invalidateUserConnections(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            const key = `user_connections:${userId}`;
            yield redis_1.default.del(key);
        });
    }
    // Stories caching
    cacheUserStories(userId_1, stories_1) {
        return __awaiter(this, arguments, void 0, function* (userId, stories, ttl = 900) {
            const key = `user_stories:${userId}`;
            yield redis_1.default.setJson(key, stories, ttl);
        });
    }
    getUserStories(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            const key = `user_stories:${userId}`;
            return yield redis_1.default.getJson(key);
        });
    }
    invalidateUserStories(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            const key = `user_stories:${userId}`;
            yield redis_1.default.del(key);
        });
    }
    // Feed caching
    cacheFeed(userId_1, feed_1) {
        return __awaiter(this, arguments, void 0, function* (userId, feed, ttl = 600) {
            const key = `feed:${userId}`;
            yield redis_1.default.setJson(key, feed, ttl);
        });
    }
    getFeed(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            const key = `feed:${userId}`;
            return yield redis_1.default.getJson(key);
        });
    }
    invalidateFeed(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            const key = `feed:${userId}`;
            yield redis_1.default.del(key);
        });
    }
    // Search results caching
    cacheSearchResults(query_1, results_1) {
        return __awaiter(this, arguments, void 0, function* (query, results, ttl = 1800) {
            const key = `search:${encodeURIComponent(query)}`;
            yield redis_1.default.setJson(key, results, ttl);
        });
    }
    getSearchResults(query) {
        return __awaiter(this, void 0, void 0, function* () {
            const key = `search:${encodeURIComponent(query)}`;
            return yield redis_1.default.getJson(key);
        });
    }
    // Session/authentication caching
    cacheSession(sessionId_1, sessionData_1) {
        return __awaiter(this, arguments, void 0, function* (sessionId, sessionData, ttl = 86400) {
            const key = `session:${sessionId}`;
            yield redis_1.default.setJson(key, sessionData, ttl);
        });
    }
    getSession(sessionId) {
        return __awaiter(this, void 0, void 0, function* () {
            const key = `session:${sessionId}`;
            return yield redis_1.default.getJson(key);
        });
    }
    invalidateSession(sessionId) {
        return __awaiter(this, void 0, void 0, function* () {
            const key = `session:${sessionId}`;
            yield redis_1.default.del(key);
        });
    }
    // Generic caching methods
    cache(key_1, data_1) {
        return __awaiter(this, arguments, void 0, function* (key, data, ttl = this.defaultTTL) {
            yield redis_1.default.setJson(key, data, ttl);
        });
    }
    get(key) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield redis_1.default.getJson(key);
        });
    }
    invalidate(key) {
        return __awaiter(this, void 0, void 0, function* () {
            yield redis_1.default.del(key);
        });
    }
    exists(key) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield redis_1.default.exists(key);
        });
    }
    // Bulk operations
    invalidatePattern(pattern) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const client = yield redis_1.default.getClient();
                if (!client)
                    return;
                const keys = yield client.keys(pattern);
                if (keys.length > 0) {
                    yield client.del(keys);
                }
            }
            catch (error) {
                console.error('Cache invalidate pattern error:', error);
            }
        });
    }
    // Invalidate user-related caches when user data changes
    invalidateUserData(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            yield Promise.all([
                this.invalidateUserProfile(userId),
                this.invalidateUserPosts(userId),
                this.invalidateUserConnections(userId),
                this.invalidateUserStories(userId),
                this.invalidateFeed(userId)
            ]);
        });
    }
    // Get cache statistics
    getCacheStats() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                if (!redis_1.default.isClientConnected()) {
                    return { connected: false };
                }
                const client = yield redis_1.default.getClient();
                if (!client)
                    return { connected: false };
                const info = yield client.info('keyspace');
                const keyCount = info.includes('db0:keys=')
                    ? parseInt(info.split('db0:keys=')[1].split(',')[0])
                    : 0;
                return { connected: true, keyCount };
            }
            catch (error) {
                console.error('Cache stats error:', error);
                return { connected: false };
            }
        });
    }
}
exports.CacheService = CacheService;
// Export singleton instance
const cacheService = new CacheService();
exports.default = cacheService;
