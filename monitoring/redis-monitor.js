const redisCloud = require('../config/redis');

class RedisMonitor {
  static async getMetrics() {
    try {
      const info = await redisCloud.client.info();
      const metrics = {
        timestamp: new Date(),
        memory: {
          used: info.used_memory_human,
          peak: info.used_memory_peak_human,
          fragmentation: info.mem_fragmentation_ratio
        },
        connections: {
          current: info.connected_clients,
          rejected: info.rejected_connections
        },
        operations: {
          totalCommands: info.total_commands_processed,
          opsPerSecond: info.instantaneous_ops_per_sec
        },
        keyspace: {
          totalKeys: info.db0 ? info.db0.keys : 0,
          expires: info.db0 ? info.db0.expires : 0
        }
      };

      return metrics;
    } catch (error) {
      console.error('Redis monitoring error:', error);
      return null;
    }
  }
}

module.exports = RedisMonitor; 