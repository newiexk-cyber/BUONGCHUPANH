/**
 * AUTHENTICATION & ROLE-BASED ACCESS CONTROL MIDDLEWARE
 * Protects administrative routes (/api/v1/admin/*) with secure API Key & Token inspection.
 */

const config = require('../config');

function requireAdminAuth(req, res, next) {
  const adminKey = req.headers['x-admin-key'] || 
                   (req.headers.authorization && req.headers.authorization.replace(/^Bearer\s+/i, ''));

  if (!adminKey || adminKey !== config.admin.secretKey) {
    return res.status(401).json({
      success: false,
      error: 'Quyền truy cập bị từ chối: Khóa quản trị (Admin Key) không hợp lệ hoặc bị thiếu.'
    });
  }

  req.isAdmin = true;
  next();
}

module.exports = {
  requireAdminAuth
};
