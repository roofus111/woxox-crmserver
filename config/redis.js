const Redis = require('ioredis');
require('dotenv').config();

// Redis Cloud Configuration
const REDIS_CONFIG = {
  host: process.env.REDIS_HOST,
  port: parseInt(process.env.REDIS_PORT),
  password: process.env.REDIS_PASSWORD,
  retryStrategy: (times) => {
    const maxRetryTime = 3000;
    const retryDelay = Math.min(times * 100, maxRetryTime);
    console.log(`Retrying Redis connection in ${retryDelay}ms...`);
    return retryDelay;
  },
  maxRetriesPerRequest: 3,
  connectTimeout: 10000,
  enableReadyCheck: true,
  showFriendlyErrorStack: true
};

// Log configuration (without sensitive data)
console.log('Redis Configuration:', {
  host: REDIS_CONFIG.host,
  port: REDIS_CONFIG.port,
  hasPassword: !!REDIS_CONFIG.password,
  tls: REDIS_CONFIG.tls
});

class RedisService {
  constructor() {
    this.client = new Redis(process.env.REDIS_HOST, {
      port: process.env.REDIS_PORT,
      password: process.env.REDIS_PASSWORD,
      retryStrategy: (times) => {
        const maxRetryTime = 3000;
        const retryDelay = Math.min(times * 100, maxRetryTime);
        console.log(`Retrying Redis connection in ${retryDelay}ms...`);
        return retryDelay;
      },
      maxRetriesPerRequest: 3,
      connectTimeout: 10000,
      enableReadyCheck: true,
      showFriendlyErrorStack: true
    });
    
    this.client.on('connect', () => {
      console.log('Redis Client Connected');
    });

    this.client.on('error', (err) => {
      console.error('Redis Client Error', err);
    });
  }

  async executeRedisOperation(operation) {
    try {
      return await operation();
    } catch (error) {
      console.error('Redis operation error:', error);
      throw error;
    }
  }

  async get(key) {
    return this.executeRedisOperation(async () => {
      const value = await this.client.get(key);
      return value ? JSON.parse(value) : null;
    });
  }

  async set(key, value, expireSeconds = 300) {
    return this.executeRedisOperation(async () => {
      await this.client.setex(key, expireSeconds, JSON.stringify(value));
      return true;
    });
  }

  async del(key) {
    return this.executeRedisOperation(async () => {
      await this.client.del(key);
      return true;
    });
  }

  async keys(pattern) {
    return this.executeRedisOperation(async () => {
      return await this.client.keys(pattern);
    });
  }

  async ttl(key) {
    return this.executeRedisOperation(async () => {
      return await this.client.ttl(key);
    });
  }

  async info(section) {
    return this.executeRedisOperation(async () => {
      return await this.client.info(section);
    });
  }

  async deletePattern(pattern) {
    return this.executeRedisOperation(async () => {
      const keys = await this.client.keys(pattern);
      if (keys.length > 0) {
        await this.client.del(keys);
      }
      return true;
    });
  }

  async clearAll() {
    return this.executeRedisOperation(async () => {
      await this.client.flushall();
      return true;
    });
  }
}

// Create and export a single instance
const redisService = new RedisService();
module.exports = redisService; 
module.exports = redisService; 