/**
 * EXPRESS APPLICATION ENTRYPOINT
 * Configures all middlewares, API routes, static client hosting, and global exception handlers.
 */

const express = require('express');
const path = require('path');
const fs = require('fs');
const config = require('./config');

// Security & Session Middlewares
const { corsMiddleware, securityHeadersMiddleware } = require('./middlewares/security.middleware');
const { rateLimitMiddleware } = require('./middlewares/rateLimit.middleware');
const { sessionMiddleware } = require('./middlewares/session.middleware');
const { notFoundHandler, globalErrorHandler } = require('./middlewares/error.middleware');

// API Routes
const apiV1Routes = require('./routes/api.routes');

const app = express();

// Trust proxy for rate limiter behind reverse proxies (Nginx / Cloudflare)
app.set('trust proxy', 1);

// 1. Core Security Middlewares (Helmet with Custom CSP)
try {
  const helmet = require('helmet');
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https://fonts.googleapis.com"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com", "data:"],
        imgSrc: ["'self'", "data:", "blob:", "https://api.canva.com", "https://*.canva.com"],
        connectSrc: ["'self'", "https://api.canva.com"],
        mediaSrc: ["'self'", "blob:", "mediastream:"],
        objectSrc: ["'none'"],
        frameAncestors: ["'self'"]
      }
    },
    crossOriginEmbedderPolicy: false
  }));
} catch (e) {
  app.use(securityHeadersMiddleware);
}

// 2. CORS and Anti-Spam Rate Limiting
try {
  const cors = require('cors');
  app.use(cors({
    origin: (origin, callback) => {
      if (
        !origin ||
        !config.isProduction ||
        config.allowedOrigins.includes(origin) ||
        config.allowedOrigins.includes('*') ||
        origin.includes('trycloudflare.com') ||
        origin.includes('localhost') ||
        origin.includes('127.0.0.1')
      ) {
        callback(null, true);
      } else {
        callback(new Error('Yêu cầu bị chặn bởi chính sách CORS bảo mật.'));
      }
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-Admin-Key', 'X-Session-ID'],
    credentials: true
  }));
} catch (e) {
  app.use(corsMiddleware);
}

app.use(rateLimitMiddleware);

// 3. User Session Context Middleware
app.use(sessionMiddleware);

// 4. Request Logging (Morgan in development)
try {
  const morgan = require('morgan');
  app.use(morgan(config.isProduction ? 'combined' : 'dev'));
} catch (e) {
  // Graceful fallback
}

// 5. Body Parsers (Synchronized 35MB payload limit for high-res 300 DPI strips)
app.use(express.json({ limit: config.payload.limitString }));
app.use(express.urlencoded({ extended: true, limit: config.payload.limitString }));

// 6. RESTful API Endpoints
app.use('/api/v1', apiV1Routes);

// Legacy backward-compatible route mappings
app.get('/api/status', (req, res) => {
  res.json({
    status: 'online',
    service: 'Photobooth Express.js Backend API',
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

app.post('/api/save-photo', (req, res, next) => {
  const photoController = require('./controllers/photo.controller');
  photoController.savePhoto(req, res, next);
});

// 7. Host Static Frontend Assets (Fallback if publicDir exists)
if (config.paths.publicDir && fs.existsSync(config.paths.publicDir)) {
  app.use(express.static(config.paths.publicDir, {
    maxAge: config.isProduction ? '1d' : 0,
    etag: true,
    // Prevent direct public browsing of storage folder
    setHeaders: (res, filePath) => {
      if (filePath.includes('storage') || filePath.includes('saved_photos')) {
        res.setHeader('Cache-Control', 'no-store, private');
      }
    }
  }));
}

// 8. Not Found & Global Error Handling
app.use(notFoundHandler);
app.use(globalErrorHandler);

module.exports = app;
