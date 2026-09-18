/**
 * ONLINE PHOTOBOOTH STUDIO — UNIFIED NATIVE SERVER LAUNCHER (BACKEND)
 * Runs Express.js if installed, or gracefully runs high-performance native Node.js HTTP server.
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

try {
  // 1. Try booting Enterprise Express.js server if dependencies are installed
  require('./server');
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
  const PORT = process.env.PORT || 5000;
  const photoService = require('./src/services/photo.service');
  const cleanupService = require('./src/services/cleanup.service');
  const { validateMagicBytes, detectFormat } = require('./src/utils/magicBytes');

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
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
    '.mp3': 'audio/mpeg',
    '.wav': 'audio/wav'
  };

  const PUBLIC_DIR = path.join(__dirname, '../frontend/public');

  const server = http.createServer(async (req, res) => {
    // Security Headers
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Session-ID, X-Admin-Key');

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
        version: '2.5.0',
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
        kioskId: 'KIOSK_ZUMPPI_01',
        createdAt: Date.now()
      }));
    }

    if (pathname === '/api/v1/photos/archive' && req.method === 'POST') {
      let body = '';
      req.on('data', chunk => {
        body += chunk;
        if (body.length > 50 * 1024 * 1024) {
          res.writeHead(413, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, error: 'File ảnh quá lớn (>50MB)' }));
          req.destroy();
        }
      });

      req.on('end', async () => {
        try {
          const payload = JSON.parse(body);
          const sessionId = req.headers['x-session-id'] || payload.sessionId;
          const { dataUrl, filename, caption } = payload;

          if (!sessionId || !dataUrl) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            return res.end(JSON.stringify({ success: false, error: 'Thiếu dữ liệu sessionId hoặc dataUrl' }));
          }

          const base64Data = dataUrl.replace(/^data:image\/\w+;base64,/, '');
          const buffer = Buffer.from(base64Data, 'base64');
          const ext = (filename && path.extname(filename).replace('.', '')) || 'png';

          if (!validateMagicBytes(buffer, ext)) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            return res.end(JSON.stringify({ success: false, error: 'Tệp tin không đúng định dạng ảnh (Magic Bytes verification failed)' }));
          }

          const saved = await photoService.savePhoto(sessionId, dataUrl, ext, caption);
          res.writeHead(200, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({
            success: true,
            fileId: saved.fileId,
            filename: saved.filename,
            viewUrl: `/api/v1/photos/view/${saved.fileId}?sessionId=${sessionId}`
          }));
        } catch (e) {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({ success: false, error: e.message }));
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

    // --- STATIC ASSETS SERVING FROM FRONTEND/PUBLIC ---
    let safePath = pathname === '/' ? '/selfbooth.html' : pathname;
    let filePath = path.join(PUBLIC_DIR, safePath);

    // Prevent directory traversal
    if (!filePath.startsWith(PUBLIC_DIR)) {
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
