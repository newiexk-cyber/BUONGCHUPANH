/**
 * HTTP SERVER LAUNCHER
 * Starts the Express.js Application and initializes background maintenance tasks.
 */

const app = require('./src/app');
const config = require('./src/config');
const cleanupService = require('./src/services/cleanup.service');

const server = app.listen(config.port, () => {
  // Start automated storage retention cleanup (purging files > 24h)
  cleanupService.startAutoCleanup(60 * 60 * 1000);

  console.log(`\n===============================================================`);
  console.log(`🚀 ONLINE PHOTOBOOTH STUDIO — ENTERPRISE EXPRESS.JS BACKEND`);
  console.log(`===============================================================`);
  console.log(`🌐 Web App Client: http://localhost:${config.port}/selfbooth.html`);
  console.log(`🩺 Health API:     http://localhost:${config.port}/api/v1/health`);
  console.log(`🛡️  Security:       Helmet (CSP), Anti-Spoof Rate Limit & Session Auth`);
  console.log(`🧹 Retention:      Auto-Cleanup Active (TTL: 24 Hours)`);
  console.log(`📁 Private Storage:${config.paths.photosDir}`);
  console.log(`⚙️  Environment:    ${config.nodeEnv.toUpperCase()}`);
  console.log(`===============================================================\n`);
});

// Graceful Shutdown Handlers
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server...');
  server.close(() => {
    console.log('HTTP server successfully closed.');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('\nGracefully shutting down Express server...');
  server.close(() => {
    console.log('HTTP server successfully closed.');
    process.exit(0);
  });
});
