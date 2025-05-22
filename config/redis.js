const Redis = require('ioredis');
require('dotenv').config();

// Redis Cloud Configuration
const REDIS_CONFIG = {
  host: process.env.REDIS_HOST,
  port: parseInt(process.env.REDIS_PORT),
  password: process.env.REDIS_PASSWORD,
  tls: true,
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
    this.client = null;
    this.isConnected = false;
    this.initializeConnection();
  }

  initializeConnection() {
    try {
      this.client = new Redis(REDIS_CONFIG);

      this.client.on('connect', () => {
        console.log('Redis Client Connected Successfully');
        this.isConnected = true;
      });

      this.client.on('error', (error) => {
        console.error('Redis Connection Error:', error);
        this.isConnected = false;
        
        // Attempt reconnection if connection is refused
        if (error.code === 'ECONNREFUSED') {
          console.log('Attempting to reconnect to Redis...');
          setTimeout(() => this.reconnect(), 5000);
        }
      });

      this.client.on('ready', () => {
        console.log('Redis Client Ready');
      });

      this.client.on('end', () => {
        console.log('Redis Connection Ended');
        this.isConnected = false;
      });

    } catch (error) {
      console.error('Redis Initialization Error:', error);
      this.isConnected = false;
    }
  }

  async reconnect() {
    try {
      if (this.client) {
        await this.client.quit();
      }
      this.initializeConnection();
    } catch (error) {
      console.error('Redis Reconnection Error:', error);
    }
  }

  // Check connection status
  async checkConnection() {
    try {
      if (!this.isConnected) {
        await this.reconnect();
      }
      return this.isConnected;
    } catch (error) {
      console.error('Connection Check Error:', error);
      return false;
    }
  }

  // Wrapper for Redis operations with connection check
  async executeRedisOperation(operation) {
    try {
      if (!await this.checkConnection()) {
        throw new Error('Redis is not connected');
      }
      return await operation();
    } catch (error) {
      console.error('Redis Operation Error:', error);
      throw error;
    }
  }

  // Redis operations with connection checking
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

  async delete(key) {
    try {
      await this.client.del(key);
      return true;
    } catch (error) {
      console.error('Redis Delete Error:', error);
      return false;
    }
  }

  // Pattern-based deletion
  async deletePattern(pattern) {
    try {
      const keys = await this.client.keys(pattern);
      if (keys.length > 0) {
        await this.client.del(...keys);
      }
      return true;
    } catch (error) {
      console.error('Redis Pattern Delete Error:', error);
      return false;
    }
  }

  // Hash operations
  async hset(hash, field, value) {
    try {
      await this.client.hset(
        hash,
        field,
        JSON.stringify(value)
      );
      return true;
    } catch (error) {
      console.error('Redis Hash Set Error:', error);
      return false;
    }
  }

  async hget(hash, field) {
    try {
      const value = await this.client.hget(hash, field);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error('Redis Hash Get Error:', error);
      return null;
    }
  }

  // Pub/Sub operations
  async publish(channel, message) {
    try {
      await this.client.publish(channel, JSON.stringify(message));
      return true;
    } catch (error) {
      console.error('Redis Publish Error:', error);
      return false;
    }
  }

  async subscribe(channel) {
    try {
      await this.client.subscribe(channel);
      return true;
    } catch (error) {
      console.error('Redis Subscribe Error:', error);
      return false;
    }
  }

  // Cache management
  async clearAll() {
    try {
      await this.client.flushall();
      return true;
    } catch (error) {
      console.error('Redis Clear All Error:', error);
      return false;
    }
  }

  // Health check
  async healthCheck() {
    try {
      const ping = await this.client.ping();
      return ping === 'PONG';
    } catch (error) {
      console.error('Redis Health Check Error:', error);
      return false;
    }
  }

  // Graceful shutdown
  async close() {
    try {
      if (this.client) {
        await this.client.quit();
        this.isConnected = false;
        console.log('Redis connection closed gracefully');
      }
    } catch (error) {
      console.error('Error closing Redis connection:', error);
    }
  }
}

// Create singleton instance
const redisService = new RedisService();
module.exports = redisService; 