/**
 * BACKEND CENTRAL CONFIGURATION MODULE
 * Loads environment variables and exposes unified configuration.
 */

const path = require('path');
const fs = require('fs');

// Try loading dotenv if available
try {
  require('dotenv').config({ path: path.join(__dirname, '../../.env') });
} catch (e) {
  // Graceful fallback if dotenv is not yet installed
}

const config = {
  port: parseInt(process.env.PORT, 10) || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  isProduction: process.env.NODE_ENV === 'production',

  // Security & CORS
  allowedOrigins: (process.env.ALLOWED_ORIGINS || 'http://localhost:3000,http://127.0.0.1:3000')
    .split(',')
    .map(origin => origin.trim()),

  // Rate Limiting
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 15 * 60 * 1000, // 15 mins
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS, 10) || 300
  },

  // Canva API Credentials (Protected Server-Side)
  canva: {
    accessToken: process.env.CANVA_ACCESS_TOKEN || 'OC-AaBH-ZfHBN78',
    apiBaseUrl: process.env.CANVA_API_BASE_URL || 'https://api.canva.com/rest/v1'
  },

  // Storage Directories
  paths: {
    publicDir: path.join(__dirname, '../../../'),
    storageDir: path.join(__dirname, '../../../saved_photos')
  }
};

// Ensure photo storage directory exists
if (!fs.existsSync(config.paths.storageDir)) {
  fs.mkdirSync(config.paths.storageDir, { recursive: true });
}

module.exports = config;
