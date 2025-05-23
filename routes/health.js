const express = require('express');
const router = express.Router();
const redisService = require('../config/redis');

router.get('/redis-health', async (req, res) => {
  try {
    const isHealthy = await redisService.healthCheck();
    if (isHealthy) {
      res.json({ status: 'healthy', message: 'Redis connection is working' });
    } else {
      res.status(503).json({ status: 'unhealthy', message: 'Redis connection failed' });
    }
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

module.exports = router; 