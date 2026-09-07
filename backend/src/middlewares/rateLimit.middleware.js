/**
 * RATE LIMITING MIDDLEWARE
 * Defends server against API spamming, brute force, and DDoS.
 */

const config = require('../config');

// In-memory request tracking map
const requestCounts = new Map();

function rateLimitMiddleware(req, res, next) {
  // Only apply to API routes
  if (!req.path.startsWith('/api/')) {
    return next();
  }

  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';
  const now = Date.now();
  const windowMs = config.rateLimit.windowMs;
  const maxRequests = config.rateLimit.maxRequests;

  let record = requestCounts.get(ip);

  if (!record || (now - record.startTime) > windowMs) {
    record = { count: 1, startTime: now };
    requestCounts.set(ip, record);
  } else {
    record.count++;
  }

  // Set standard rate limit headers
  res.setHeader('X-RateLimit-Limit', maxRequests);
  res.setHeader('X-RateLimit-Remaining', Math.max(0, maxRequests - record.count));
  res.setHeader('X-RateLimit-Reset', Math.ceil((record.startTime + windowMs) / 1000));

  if (record.count > maxRequests) {
    return res.status(429).json({
      success: false,
      error: 'Quá nhiều yêu cầu từ IP của bạn. Vui lòng thử lại sau ít phút (Rate limit exceeded).',
      retryAfterSeconds: Math.ceil((record.startTime + windowMs - now) / 1000)
    });
  }

  next();
}

module.exports = {
  rateLimitMiddleware
};
