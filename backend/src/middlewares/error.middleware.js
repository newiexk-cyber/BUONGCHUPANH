/**
 * GLOBAL ERROR HANDLING MIDDLEWARE
 * Safely catches exceptions, prevents stack trace leakage, and formats standard responses.
 */

const config = require('../config');

// 404 Not Found Handler for API
function notFoundHandler(req, res, next) {
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({
      success: false,
      error: `Endpoint '${req.method} ${req.originalUrl}' không tồn tại trên hệ thống API.`
    });
  }
  next();
}

// Global Exception Handler
function globalErrorHandler(err, req, res, next) {
  console.error(`[BACKEND ERROR] ${new Date().toISOString()} - ${req.method} ${req.url}:`, err);

  const statusCode = err.statusCode || err.status || 500;
  const response = {
    success: false,
    error: err.message || 'Lỗi xử lý máy chủ nội bộ (Internal Server Error)',
    timestamp: new Date().toISOString()
  };

  // Only attach detailed stack trace in development mode
  if (!config.isProduction) {
    response.stack = err.stack;
  }

  res.status(statusCode).json(response);
}

module.exports = {
  notFoundHandler,
  globalErrorHandler
};
