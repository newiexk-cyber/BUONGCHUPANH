/**
 * AUTOMATED STORAGE RETENTION & CLEANUP SERVICE
 * Periodically purges temporary photo sessions older than retention TTL (24h).
 */

const fs = require('fs');
const path = require('path');
const config = require('../config');

class CleanupService {
  constructor() {
    this.intervalHandle = null;
    this.retentionMs = config.session.ttlMs; // 24 hours
  }

  /**
   * Starts background recurring cleanup job (every 1 hour)
   */
  startAutoCleanup(intervalMs = 60 * 60 * 1000) {
    if (this.intervalHandle) return;

    // Run initial check after 30s
    setTimeout(() => this.runCleanupNow(), 30000);

    this.intervalHandle = setInterval(() => {
      this.runCleanupNow();
    }, intervalMs);

    // Unref so it won't prevent graceful server exit
    if (this.intervalHandle.unref) {
      this.intervalHandle.unref();
    }
  }

  /**
   * Executes a purge run for expired sessions
   */
  async runCleanupNow() {
    const photosDir = config.paths.photosDir;
    if (!fs.existsSync(photosDir)) return;

    try {
      const entries = await fs.promises.readdir(photosDir, { withFileTypes: true });
      const now = Date.now();
      let purgedCount = 0;

      for (const entry of entries) {
        if (entry.isDirectory()) {
          const sessionPath = path.join(photosDir, entry.name);
          const stat = await fs.promises.stat(sessionPath);
          const ageMs = now - (stat.mtimeMs || stat.birthtimeMs || 0);

          if (ageMs > this.retentionMs) {
            await fs.promises.rm(sessionPath, { recursive: true, force: true });
            purgedCount++;
          }
        }
      }

      if (purgedCount > 0) {
        console.log(`[STORAGE CLEANUP] Đã tự động dọn dẹp ${purgedCount} phiên chụp ảnh hết hạn (>24h).`);
      }
    } catch (err) {
      console.warn('[STORAGE CLEANUP ERROR]:', err.message);
    }
  }
}

module.exports = new CleanupService();
