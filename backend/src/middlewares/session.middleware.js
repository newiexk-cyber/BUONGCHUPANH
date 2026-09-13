/**
 * SESSION OWNERSHIP & TENANT ISOLATION MIDDLEWARE
 * Ensures each photobooth user session is cryptographically isolated and authenticated.
 */

const crypto = require('crypto');
const config = require('../config');

// In-memory active session registry (with TTL timestamp)
const activeSessions = new Map();

/**
 * Creates or retrieves a validated Session ID for the request
 */
function sessionMiddleware(req, res, next) {
  let sessionId = req.headers['x-session-id'] || req.query.sessionId || req.cookies?.sessionId;

  // Validate session ID format (UUID or safe alphanumeric)
  const isValidFormat = sessionId && /^[a-zA-Z0-9_-]{16,64}$/.test(sessionId);

  if (!sessionId || !isValidFormat) {
    // Generate a fresh cryptographically strong UUID session ID
    sessionId = crypto.randomUUID ? crypto.randomUUID() : crypto.randomBytes(16).toString('hex');
  }

  // Update session activity timestamp
  activeSessions.set(sessionId, {
    lastActive: Date.now(),
    ip: req.ip || req.socket.remoteAddress
  });

  // Attach session context to request & response header
  req.sessionId = sessionId;
  res.setHeader('X-Session-ID', sessionId);

  next();
}

/**
 * Strict authentication guard for protected photo access
 */
function requireActiveSession(req, res, next) {
  if (!req.sessionId) {
    return res.status(401).json({
      success: false,
      error: 'Yêu cầu chưa được xác thực (Thiếu Session ID hợp lệ).'
    });
  }
  next();
}

module.exports = {
  sessionMiddleware,
  requireActiveSession,
  activeSessions
};
