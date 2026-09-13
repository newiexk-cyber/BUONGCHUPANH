/**
 * ONLINE PHOTOBOOTH STUDIO — ROOT ENTRYPOINT
 * Launches the secure Express.js Backend API server.
 */

const path = require('path');

try {
  // Delegate directly to the Express.js Application Server
  require('./backend/server');
} catch (err) {
  console.error('\n❌ [SERVER STARTUP ERROR] Không thể khởi động máy chủ Express.js:');
  console.error(`Chi tiết lỗi: ${err.message}`);
  console.error('\n👉 HƯỚNG DẪN KHẮC PHỤC:');
  console.error('Vui lòng chạy lệnh cài đặt dependencies trước khi khởi động:');
  console.error('   npm install\n');
  process.exit(1);
}
