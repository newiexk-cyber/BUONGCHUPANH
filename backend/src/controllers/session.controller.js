/**
 * SESSION CONTROLLER
 * Manages photobooth user session lifecycle and tokens.
 */

const crypto = require('crypto');
const config = require('../config');

class SessionController {
  startSession(req, res) {
    const sessionId = req.sessionId || (crypto.randomUUID ? crypto.randomUUID() : crypto.randomBytes(16).toString('hex'));
    const expiresAt = new Date(Date.now() + config.session.ttlMs).toISOString();

    res.status(200).json({
      success: true,
      message: 'Khởi tạo phiên chụp ảnh bảo mật thành công.',
      data: {
        sessionId,
        expiresAt,
        storageQuotaMB: 35,
        retentionHours: 24
      }
    });
  }
}

module.exports = new SessionController();
