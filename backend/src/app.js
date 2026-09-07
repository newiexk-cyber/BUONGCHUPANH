/**
 * EXPRESS APPLICATION ENTRYPOINT
 * Configures all middlewares, API routes, static client hosting, and global exception handlers.
 */

const express = require('express');
const path = require('path');
const config = require('./config');

// Security & Utility Middlewares
const { corsMiddleware, securityHeadersMiddleware } = require('./middlewares/security.middleware');
const { rateLimitMiddleware } = require('./middlewares/rateLimit.middleware');
const { notFoundHandler, globalErrorHandler } = require('./middlewares/error.middleware');

// API Routes
const apiV1Routes = require('./routes/api.routes');

const app = express();

// 1. Core Security Middlewares
// Try using helmet if installed, otherwise fallback to securityHeadersMiddleware
try {
  const helmet = require('helmet');
  app.use(helmet({
    contentSecurityPolicy: false, // Allows flexible canvas image loading & WebRTC video
    crossOriginEmbedderPolicy: false
  }));
} catch (e) {
  app.use(securityHeadersMiddleware);
}

// 2. CORS and Rate Limiting
try {
  const cors = require('cors');
  app.use(cors({
    origin: (origin, callback) => {
      if (!origin || config.allowedOrigins.includes(origin) || config.allowedOrigins.includes('*') || !config.isProduction) {
        callback(null, true);
      } else {
        callback(new Error('Bị chặn bởi chính sách CORS bảo mật.'));
      }
    },
    credentials: true
  }));
} catch (e) {
  app.use(corsMiddleware);
}

app.use(rateLimitMiddleware);

// 3. Request Logging (Morgan in development)
try {
  const morgan = require('morgan');
  app.use(morgan(config.isProduction ? 'combined' : 'dev'));
} catch (e) {
  // Graceful fallback
}

// 4. Body Parsers (Large payload support for 300 DPI high-res print strips)
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// 5. RESTful API Endpoints
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

// 6. Host Static Frontend Assets (Web Client UI)
app.use(express.static(config.paths.publicDir, {
  maxAge: config.isProduction ? '1d' : 0,
  etag: true
}));

// 7. Not Found & Global Error Handling
app.use(notFoundHandler);
app.use(globalErrorHandler);

module.exports = app;
