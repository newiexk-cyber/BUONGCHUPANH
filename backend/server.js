/**
 * HTTP SERVER LAUNCHER
 * Starts the Express.js Application on the designated port.
 */

const app = require('./src/app');
const config = require('./src/config');

const server = app.listen(config.port, () => {
  console.log(`\n===============================================================`);
  console.log(`🚀 ONLINE PHOTOBOOTH STUDIO — EXPRESS.JS BACKEND RUNNING`);
  console.log(`===============================================================`);
  console.log(`🌐 Web App Client: http://localhost:${config.port}/selfbooth.html`);
  console.log(`🩺 Health API:     http://localhost:${config.port}/api/v1/health`);
  console.log(`🛡️  Security:       Helmet, CORS Whitelist & Rate Limiting ACTIVE`);
  console.log(`📁 Storage:        ${config.paths.storageDir}`);
  console.log(`⚙️  Environment:    ${config.nodeEnv.toUpperCase()}`);
  console.log(`===============================================================\n`);
});

// Graceful Shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
  });
});

process.on('SIGINT', () => {
  console.log('\nGracefully shutting down Express server...');
  server.close(() => {
    console.log('HTTP server closed');
    process.exit(0);
  });
});
