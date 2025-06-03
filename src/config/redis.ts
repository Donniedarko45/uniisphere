import { createClient, RedisClientType } from 'redis';

class RedisManager {
  private client: RedisClientType | null = null;
  private isConnected: boolean = false;

  constructor() {
    this.initializeClient();
  }

  private async initializeClient() {
    try {
      this.client = createClient({
        url: process.env.REDIS_URL || 'redis://localhost:6379',
        socket: {
          connectTimeout: 5000,
          reconnectStrategy: (retries: number) => {
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

      await this.client.connect();
    } catch (error) {
      console.error('Failed to initialize Redis client:', error);
      this.client = null;
      this.isConnected = false;
    }
  }

  public async getClient(): Promise<RedisClientType | null> {
    if (!this.client || !this.isConnected) {
      await this.initializeClient();
    }
    return this.client;
  }

  public isClientConnected(): boolean {
    return this.isConnected && this.client !== null;
  }

  // Caching utilities
  public async get(key: string): Promise<string | null> {
    try {
      if (!this.isClientConnected()) return null;
      return await this.client!.get(key);
    } catch (error) {
      console.error('Redis GET error:', error);
      return null;
    }
  }

  public async set(key: string, value: string, ttl?: number): Promise<boolean> {
    try {
      if (!this.isClientConnected()) return false;
      
      if (ttl) {
        await this.client!.setEx(key, ttl, value);
      } else {
        await this.client!.set(key, value);
      }
      return true;
    } catch (error) {
      console.error('Redis SET error:', error);
      return false;
    }
  }

  public async del(key: string): Promise<boolean> {
    try {
      if (!this.isClientConnected()) return false;
      await this.client!.del(key);
      return true;
    } catch (error) {
      console.error('Redis DEL error:', error);
      return false;
    }
  }

  public async exists(key: string): Promise<boolean> {
    try {
      if (!this.isClientConnected()) return false;
      const result = await this.client!.exists(key);
      return result === 1;
    } catch (error) {
      console.error('Redis EXISTS error:', error);
      return false;
    }
  }

  public async setJson(key: string, value: any, ttl?: number): Promise<boolean> {
    try {
      const jsonString = JSON.stringify(value);
      return await this.set(key, jsonString, ttl);
    } catch (error) {
      console.error('Redis SET JSON error:', error);
      return false;
    }
  }

  public async getJson<T>(key: string): Promise<T | null> {
    try {
      const jsonString = await this.get(key);
      if (!jsonString) return null;
      return JSON.parse(jsonString) as T;
    } catch (error) {
      console.error('Redis GET JSON error:', error);
      return null;
    }
  }

  public async disconnect(): Promise<void> {
    try {
      if (this.client) {
        await this.client.disconnect();
        this.isConnected = false;
      }
    } catch (error) {
      console.error('Redis disconnect error:', error);
    }
  }

  // Rate limiting specific methods
  public async incrementKey(key: string, ttl: number): Promise<number> {
    try {
      if (!this.isClientConnected()) return 0;
      
      const multi = this.client!.multi();
      multi.incr(key);
      multi.expire(key, ttl);
      const results = await multi.exec();
      
      return (results?.[0] as unknown as number) || 0;
    } catch (error) {
      console.error('Redis INCREMENT error:', error);
      return 0;
    }
  }

  public async getKeyTTL(key: string): Promise<number> {
    try {
      if (!this.isClientConnected()) return -1;
      return await this.client!.ttl(key);
    } catch (error) {
      console.error('Redis TTL error:', error);
      return -1;
    }
  }
}

// Create and export singleton instance
const redisManager = new RedisManager();
export default redisManager;

// Export client getter for direct access if needed
export const getRedisClient = () => redisManager.getClient(); 