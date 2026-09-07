/**
 * HEALTH CONTROLLER
 * Provides server health metrics, memory usage, and runtime info.
 */

const config = require('../config');

class HealthController {
  getHealth(req, res) {
    const memory = process.memoryUsage();

    res.status(200).json({
      success: true,
      service: 'Online Photobooth Express.js Backend API',
      status: 'healthy',
      version: '1.0.0',
      nodeVersion: process.version,
      environment: config.nodeEnv,
      uptimeSeconds: Math.floor(process.uptime()),
      timestamp: new Date().toISOString(),
      system: {
        memoryHeapUsedMB: Math.round(memory.heapUsed / 1024 / 1024 * 100) / 100,
        memoryRssMB: Math.round(memory.rss / 1024 / 1024 * 100) / 100
      }
    });
  }
}

module.exports = new HealthController();
