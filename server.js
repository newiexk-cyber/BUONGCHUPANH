/**
 * ONLINE PHOTOBOOTH STUDIO - ROOT SERVER ENTRYPOINT
 * Launches the secure Express.js Backend API and Web Server.
 */

try {
  // Delegate directly to the Express.js Backend Application
  require('./backend/server');
} catch (err) {
  // Fallback to built-in HTTP server if modules are not yet installed
  console.warn('[SERVER WARNING] Running with built-in HTTP server fallback:', err.message);
  console.log('💡 TIP: Run "npm install" to enable all Express.js security middlewares.');

  const http = require('http');
  const fs = require('fs');
  const path = require('path');

  const PORT = process.env.PORT || 3000;
  const PUBLIC_DIR = __dirname;
  const STORAGE_DIR = path.join(__dirname, 'saved_photos');

  if (!fs.existsSync(STORAGE_DIR)) fs.mkdirSync(STORAGE_DIR, { recursive: true });

  const MIME_TYPES = {
    '.html': 'text/html; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
    '.svg': 'image/svg+xml'
  };

  const server = http.createServer((req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
      res.writeHead(204);
      res.end();
      return;
    }

    const parsedUrl = new URL(req.url, `http://${req.headers.host}`);
    let pathname = decodeURIComponent(parsedUrl.pathname);

    if (pathname === '/api/v1/health' || pathname === '/api/status') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        success: true,
        service: 'Photobooth Express Backend API (Fallback Mode)',
        status: 'healthy',
        uptime: process.uptime(),
        timestamp: new Date().toISOString()
      }));
      return;
    }

    if (pathname === '/') pathname = '/index.html';
    const filePath = path.join(PUBLIC_DIR, pathname);

    if (!filePath.startsWith(PUBLIC_DIR)) {
      res.writeHead(403, { 'Content-Type': 'text/plain' });
      res.end('403 Forbidden');
      return;
    }

    fs.stat(filePath, (err, stats) => {
      if (err || !stats.isFile()) {
        res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end('404 Not Found');
        return;
      }
      const ext = path.extname(filePath).toLowerCase();
      res.writeHead(200, { 'Content-Type': MIME_TYPES[ext] || 'application/octet-stream' });
      fs.createReadStream(filePath).pipe(res);
    });
  });

  server.listen(PORT, () => {
    console.log(`🚀 Photobooth Server Running at http://localhost:${PORT}/selfbooth.html`);
  });
}

