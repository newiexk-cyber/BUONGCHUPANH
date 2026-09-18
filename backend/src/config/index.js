/**
 * BACKEND CENTRAL CONFIGURATION MODULE
 * Loads environment variables and exposes unified configuration for 3-tier architecture.
 */

const path = require('path');
const fs = require('fs');

// Load environment variables from backend/.env or process.env
try {
  const envPath = path.join(__dirname, '../../.env');
  if (fs.existsSync(envPath)) {
    require('dotenv').config({ path: envPath });
  } else {
    require('dotenv').config();
  }
} catch (e) {
  // Ignore if dotenv is not present
}

const config = {
  // Port configuration: Defaults to 5000 to cleanly separate from Next.js (3000)
  port: parseInt(process.env.PORT || process.env.BACKEND_PORT, 10) || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',
  isProduction: process.env.NODE_ENV === 'production',

  // Security & CORS Whitelist
  allowedOrigins: (process.env.ALLOWED_ORIGINS || 'http://localhost:3000,http://127.0.0.1:3000,http://localhost:5000')
    .split(',')
    .map(origin => origin.trim()),

  // Admin Authentication Key
  admin: {
    secretKey: process.env.ADMIN_SECRET_KEY || 'zumppi_admin_secret_key_2026'
  },

  // Session Security
  session: {
    secret: process.env.SESSION_SECRET || 'photobooth-crypto-session-secret-2026',
    ttlMs: (parseInt(process.env.SESSION_RETENTION_HOURS, 10) || 24) * 60 * 60 * 1000
  },

  // Rate Limiting
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 15 * 60 * 1000, // 15 mins
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS, 10) || 400
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
    storageDir: path.join(__dirname, '../../storage'),
    photosDir: path.join(__dirname, '../../storage/photos'),
    templatesDir: path.join(__dirname, '../../storage/templates'),
    dataDir: path.join(__dirname, '../../storage/data'),
    publicDir: path.join(__dirname, '../../../frontend/public')
  }
};

// Ensure private directories exist
Object.values(config.paths).forEach(dirPath => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
});

module.exports = config;
