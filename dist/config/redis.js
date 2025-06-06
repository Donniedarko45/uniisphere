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
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRedisClient = void 0;
const redis_1 = require("redis");
class RedisManager {
    constructor() {
        this.client = null;
        this.isConnected = false;
        this.initializeClient();
    }
    initializeClient() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                this.client = (0, redis_1.createClient)({
                    url: process.env.REDIS_URL || 'redis://localhost:6379',
                    socket: {
                        connectTimeout: 5000,
                        reconnectStrategy: (retries) => {
                            if (retries > 10) {
                                console.error('Too many Redis reconnection attempts');
                                return false;
                            }
                            return Math.min(retries * 100, 3000);
                        }
                    }
                });
                this.client.on('error', (err) => {
                    console.error('Redis Client Error:', err);
                    this.isConnected = false;
                });
                this.client.on('connect', () => {
                    console.log('Redis Client Connected');
                    this.isConnected = true;
                });
                this.client.on('disconnect', () => {
                    console.log('Redis Client Disconnected');
                    this.isConnected = false;
                });
                yield this.client.connect();
            }
            catch (error) {
                console.error('Failed to initialize Redis client:', error);
                this.client = null;
                this.isConnected = false;
            }
        });
    }
    getClient() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.client || !this.isConnected) {
                yield this.initializeClient();
            }
            return this.client;
        });
    }
    isClientConnected() {
        return this.isConnected && this.client !== null;
    }
    // Caching utilities
    get(key) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                if (!this.isClientConnected())
                    return null;
                return yield this.client.get(key);
            }
            catch (error) {
                console.error('Redis GET error:', error);
                return null;
            }
        });
    }
    set(key, value, ttl) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                if (!this.isClientConnected())
                    return false;
                if (ttl) {
                    yield this.client.setEx(key, ttl, value);
                }
                else {
                    yield this.client.set(key, value);
                }
                return true;
            }
            catch (error) {
                console.error('Redis SET error:', error);
                return false;
            }
        });
    }
    del(key) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                if (!this.isClientConnected())
                    return false;
                yield this.client.del(key);
                return true;
            }
            catch (error) {
                console.error('Redis DEL error:', error);
                return false;
            }
        });
    }
    exists(key) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                if (!this.isClientConnected())
                    return false;
                const result = yield this.client.exists(key);
                return result === 1;
            }
            catch (error) {
                console.error('Redis EXISTS error:', error);
                return false;
            }
        });
    }
    setJson(key, value, ttl) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const jsonString = JSON.stringify(value);
                return yield this.set(key, jsonString, ttl);
            }
            catch (error) {
                console.error('Redis SET JSON error:', error);
                return false;
            }
        });
    }
    getJson(key) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const jsonString = yield this.get(key);
                if (!jsonString)
                    return null;
                return JSON.parse(jsonString);
            }
            catch (error) {
                console.error('Redis GET JSON error:', error);
                return null;
            }
        });
    }
    disconnect() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                if (this.client) {
                    yield this.client.disconnect();
                    this.isConnected = false;
                }
            }
            catch (error) {
                console.error('Redis disconnect error:', error);
            }
        });
    }
    // Rate limiting specific methods
    incrementKey(key, ttl) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                if (!this.isClientConnected())
                    return 0;
                const multi = this.client.multi();
                multi.incr(key);
                multi.expire(key, ttl);
                const results = yield multi.exec();
                return (results === null || results === void 0 ? void 0 : results[0]) || 0;
            }
            catch (error) {
                console.error('Redis INCREMENT error:', error);
                return 0;
            }
        });
    }
    getKeyTTL(key) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                if (!this.isClientConnected())
                    return -1;
                return yield this.client.ttl(key);
            }
            catch (error) {
                console.error('Redis TTL error:', error);
                return -1;
            }
        });
    }
}
// Create and export singleton instance
const redisManager = new RedisManager();
exports.default = redisManager;
// Export client getter for direct access if needed
const getRedisClient = () => redisManager.getClient();
exports.getRedisClient = getRedisClient;
