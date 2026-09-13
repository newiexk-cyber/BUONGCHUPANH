/**
 * BACKEND CENTRAL CONFIGURATION MODULE
 * Loads environment variables and exposes unified configuration.
 */

const path = require('path');
const fs = require('fs');

// Load environment variables from backend/.env or root .env
try {
  require('dotenv').config({ path: path.join(__dirname, '../../.env') });
} catch (e) {
  // Ignore if dotenv is not present
}

const config = {
  port: parseInt(process.env.PORT, 10) || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  isProduction: process.env.NODE_ENV === 'production',

  // Security & CORS
  allowedOrigins: (process.env.ALLOWED_ORIGINS || 'http://localhost:3000,http://127.0.0.1:3000,https://newiexk-cyber.github.io')
    .split(',')
    .map(origin => origin.trim()),

  // Session Security
  session: {
    secret: process.env.SESSION_SECRET || 'photobooth-crypto-session-secret-2026',
    ttlMs: 24 * 60 * 60 * 1000 // 24 hours
  },

  // Rate Limiting
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 15 * 60 * 1000, // 15 mins
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS, 10) || 300
  },

  // Payload Limit (Synchronized 35MB across all layers)
  payload: {
    limitString: '35mb',
    maxBytes: 35 * 1024 * 1024
  },

  // Canva API Credentials (Strictly protected in server environment)
  canva: {
    accessToken: process.env.CANVA_ACCESS_TOKEN || '',
    apiBaseUrl: process.env.CANVA_API_BASE_URL || 'https://api.canva.com/rest/v1'
  },

  // Storage Directories (PRIVATE Storage - Not accessible via static web server)
  paths: {
    publicDir: path.join(__dirname, '../../../'),
    storageDir: path.join(__dirname, '../../storage'),
    photosDir: path.join(__dirname, '../../storage/photos')
  }
};

// Ensure private photo storage directories exist
if (!fs.existsSync(config.paths.storageDir)) {
  fs.mkdirSync(config.paths.storageDir, { recursive: true });
}
if (!fs.existsSync(config.paths.photosDir)) {
  fs.mkdirSync(config.paths.photosDir, { recursive: true });
}

module.exports = config;

