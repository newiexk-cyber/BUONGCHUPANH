/**
 * ONLINE PHOTOBOOTH STUDIO — UNIFIED SERVER LAUNCHER
 * Runs Express.js if installed, or gracefully runs high-performance native Node.js HTTP server.
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

try {
  // 1. Try booting Enterprise Express.js server if dependencies are installed
  require('./backend/server');
} catch (err) {
  if (err.code === 'MODULE_NOT_FOUND' && err.message.includes('express')) {
    console.log('\n[INFO] Khởi chạy bằng Native Node.js HTTP Server (Zero Dependencies Mode)...');
    startNativeServer();
  } else {
    console.error('\n❌ [SERVER STARTUP ERROR]:', err);
    startNativeServer();
  }
}

function startNativeServer() {
  const PORT = process.env.PORT || 3000;
  const photoService = require('./backend/src/services/photo.service');
  const cleanupService = require('./backend/src/services/cleanup.service');
  const { validateMagicBytes, detectFormat } = require('./backend/src/utils/magicBytes');

  // Start 24h auto cleanup
  cleanupService.startAutoCleanup(60 * 60 * 1000);

  const MIME_TYPES = {
    '.html': 'text/html; charset=UTF-8',
    '.css': 'text/css; charset=UTF-8',
    '.js': 'application/javascript; charset=UTF-8',
    '.json': 'application/json; charset=UTF-8',
    '.webmanifest': 'application/manifest+json; charset=UTF-8',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
    '.mp3': 'audio/mpeg',
    '.wav': 'audio/wav'
  };

  const server = http.createServer(async (req, res) => {
    // Security Headers (Helmet equivalents)
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Session-ID');

    if (req.method === 'OPTIONS') {
      res.writeHead(204);
      return res.end();
    }

    const parsedUrl = url.parse(req.url, true);
    const pathname = parsedUrl.pathname;

    // --- REST API ENDPOINTS ---
    if (pathname === '/api/v1/health') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({
        status: 'OK',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        mode: 'Native Standalone'
      }));
    }

    if (pathname === '/api/v1/config/public') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({
        success: true,
        appName: 'BUỒNG CHỤP ẢNH — 35MM ANALOG KIOSK',
        version: '2.0.0',
        maxUploadPayloadMB: 35,
        sessionRetentionHours: 24,
        features: {
          magicBytesValidation: true,
          sessionIsolation: true,
          nativeMode: true
        }
      }));
    }

    if (pathname === '/api/v1/session/start' && req.method === 'POST') {
      const crypto = require('crypto');
      const sessionId = crypto.randomUUID ? crypto.randomUUID() : crypto.randomBytes(16).toString('hex');
      res.writeHead(200, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({
        success: true,
        sessionId,
        expiresInMs: 24 * 60 * 60 * 1000,
        message: 'Phiên làm việc đã được khởi tạo thành công.'
      }));
    }

    if (pathname === '/api/v1/photos/archive' && req.method === 'POST') {
      let body = '';
      req.on('data', chunk => { body += chunk; });
      req.on('end', async () => {
        try {
          const payload = JSON.parse(body || '{}');
          const sessionId = payload.sessionId || req.headers['x-session-id'] || 'session_' + Date.now();
          const dataUrl = payload.dataUrl;

          if (!dataUrl) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            return res.end(JSON.stringify({ success: false, error: 'Thiếu dữ liệu dataUrl' }));
          }

          const saved = await photoService.savePhoto(sessionId, dataUrl, 'png', payload.caption || '');
          res.writeHead(200, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({ success: true, photo: saved }));
        } catch (err) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({ success: false, error: err.message }));
        }
      });
      return;
    }

    if (pathname.startsWith('/api/v1/photos/view/')) {
      const fileId = pathname.replace('/api/v1/photos/view/', '');
      const sessionId = parsedUrl.query.sessionId;

      if (!sessionId || !fileId) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ success: false, error: 'Thiếu sessionId hoặc fileId' }));
      }

      const filePath = await photoService.getPhotoPathBySession(sessionId, fileId);
      if (!filePath || !fs.existsSync(filePath)) {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ success: false, error: 'Không tìm thấy ảnh hoặc phiên làm việc đã hết hạn' }));
      }

      const ext = path.extname(filePath).toLowerCase();
      const mime = MIME_TYPES[ext] || 'application/octet-stream';
      res.writeHead(200, { 'Content-Type': mime });
      return fs.createReadStream(filePath).pipe(res);
    }

    // --- STATIC ASSETS SERVING ---
    let safePath = pathname === '/' ? '/selfbooth.html' : pathname;
    let filePath = path.join(__dirname, safePath);

    // Prevent directory traversal
    if (!filePath.startsWith(__dirname)) {
      res.writeHead(403);
      return res.end('Forbidden');
    }

    fs.stat(filePath, (err, stats) => {
      if (err || !stats.isFile()) {
        res.writeHead(404, { 'Content-Type': 'text/plain; charset=UTF-8' });
        return res.end('404 Not Found');
      }

      const ext = path.extname(filePath).toLowerCase();
      const contentType = MIME_TYPES[ext] || 'application/octet-stream';

      res.writeHead(200, { 'Content-Type': contentType });
      fs.createReadStream(filePath).pipe(res);
    });
  });

  server.listen(PORT, () => {
    console.log(`\n===============================================================`);
    console.log(`🚀 ONLINE PHOTOBOOTH STUDIO — SERVER RUNNING`);
    console.log(`===============================================================`);
    console.log(`🌐 Web App Client: http://localhost:${PORT}/selfbooth.html`);
    console.log(`🩺 Health API:     http://localhost:${PORT}/api/v1/health`);
    console.log(`📱 QR Download:    http://localhost:${PORT}/download.html`);
    console.log(`🛡️  Security:       Magic Bytes Validation, Session Isolation & 24h Cleanup`);
    console.log(`===============================================================\n`);
  });
}
