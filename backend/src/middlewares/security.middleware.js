/**
 * SECURITY MIDDLEWARE
 * Implements HTTP header hardening (Helmet) and safe CORS whitelist.
 */

const config = require('../config');

// Safe CORS setup
function corsMiddleware(req, res, next) {
  const origin = req.headers.origin;

  // Allow all in dev, or check whitelist in prod, or allow trycloudflare.com / localhost
  if (!config.isProduction || !origin || config.allowedOrigins.includes(origin) || config.allowedOrigins.includes('*') || (origin && origin.includes('trycloudflare.com'))) {
    res.setHeader('Access-Control-Allow-Origin', origin || '*');
  }

  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, X-Admin-Key, X-Session-ID');
  res.setHeader('Access-Control-Allow-Credentials', 'true');

  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }

  next();
}

// Basic security headers fallback if helmet is not installed
function securityHeadersMiddleware(req, res, next) {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.removeHeader('X-Powered-By');
  next();
}

module.exports = {
  corsMiddleware,
  securityHeadersMiddleware
};
