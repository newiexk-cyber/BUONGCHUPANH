/**
 * PHOTO REPOSITORY (DATA ACCESS LAYER)
 * Manages raw file I/O operations for photos, isolated session storage, and disk stats.
 */

const fs = require('fs');
const path = require('path');
const config = require('../config');

class PhotoRepository {
  /**
   * Resolves and ensures private directory for a given session
   * @param {string} sessionId 
   * @returns {Promise<string>}
   */
  async ensureSessionDir(sessionId) {
    const safeSessionId = path.basename(sessionId);
    const sessionDir = path.join(config.paths.photosDir, safeSessionId);

    if (!fs.existsSync(sessionDir)) {
      await fs.promises.mkdir(sessionDir, { recursive: true });
    }

    return sessionDir;
  }

  /**
   * Writes photo buffer to session directory
   * @param {string} sessionId 
   * @param {string} filename 
   * @param {Buffer} buffer 
   * @returns {Promise<string>} Absolute file path
   */
  async writePhotoFile(sessionId, filename, buffer) {
    const sessionDir = await this.ensureSessionDir(sessionId);
    const safeFilename = path.basename(filename);
    const filePath = path.join(sessionDir, safeFilename);

    await fs.promises.writeFile(filePath, buffer);
    return filePath;
  }

  /**
   * Lists all photo filenames and stats for a session
   * @param {string} sessionId 
   * @returns {Promise<Array<{fileId: string, filename: string, sizeBytes: number, createdAt: Date}>>}
   */
  async listSessionPhotos(sessionId) {
    const safeSessionId = path.basename(sessionId);
    const sessionDir = path.join(config.paths.photosDir, safeSessionId);

    if (!fs.existsSync(sessionDir)) {
      return [];
    }

    const files = await fs.promises.readdir(sessionDir);
    const results = [];

    for (const file of files) {
      const filePath = path.join(sessionDir, file);
      const stat = await fs.promises.stat(filePath);

      if (stat.isFile()) {
        const fileUUID = file.replace(/^strip_|\.[^.]+$/g, '');
        results.push({
          fileId: fileUUID,
          filename: file,
          sessionId,
          sizeBytes: stat.size,
          createdAt: stat.birthtime || stat.mtime
        });
      }
    }

    return results;
  }

  /**
   * Locates photo file by session and fileUUID
   * @param {string} sessionId 
   * @param {string} fileUUID 
   * @returns {Promise<string|null>}
   */
  async findPhotoPath(sessionId, fileUUID) {
    if (!sessionId || !fileUUID) return null;

    const safeSessionId = path.basename(sessionId);
    const safeUUID = path.basename(fileUUID);
    const sessionDir = path.join(config.paths.photosDir, safeSessionId);

    if (!fs.existsSync(sessionDir)) return null;

    const files = await fs.promises.readdir(sessionDir);
    const target = files.find(f => f.includes(safeUUID));

    return target ? path.join(sessionDir, target) : null;
  }

  /**
   * Fallback lookup: search fileUUID across all session directories
   */
  async findPhotoAnySession(fileUUID) {
    if (!fileUUID) return null;
    const safeUUID = path.basename(fileUUID);
    const photosDir = config.paths.photosDir;
    if (!fs.existsSync(photosDir)) return null;

    const sessions = await fs.promises.readdir(photosDir, { withFileTypes: true });
    for (const sess of sessions) {
      if (sess.isDirectory()) {
        const sessPath = path.join(photosDir, sess.name);
        const files = await fs.promises.readdir(sessPath);
        const target = files.find(f => f.includes(safeUUID));
        if (target) {
          return path.join(sessPath, target);
        }
      }
    }
    return null;
  }

  /**
   * Calculates total disk storage consumed by all photos
   * @returns {Promise<{totalBytes: number, totalSessions: number, totalPhotos: number}>}
   */
  async getStorageMetrics() {
    const photosDir = config.paths.photosDir;
    let totalBytes = 0;
    let totalSessions = 0;
    let totalPhotos = 0;

    if (!fs.existsSync(photosDir)) {
      return { totalBytes, totalSessions, totalPhotos };
    }

    const sessions = await fs.promises.readdir(photosDir, { withFileTypes: true });

    for (const sess of sessions) {
      if (sess.isDirectory()) {
        totalSessions++;
        const sessPath = path.join(photosDir, sess.name);
        const files = await fs.promises.readdir(sessPath);

        for (const file of files) {
          const filePath = path.join(sessPath, file);
          const stat = await fs.promises.stat(filePath);
          if (stat.isFile()) {
            totalBytes += stat.size;
            totalPhotos++;
          }
        }
      }
    }

    return { totalBytes, totalSessions, totalPhotos };
  }

  /**
   * Lists all archived photos across all sessions for admin review
   * @returns {Promise<Array<{fileId: string, filename: string, sessionId: string, sizeBytes: number, sizeMB: string, createdAt: Date, viewUrl: string}>>}
   */
  async listAllPhotos() {
    const photosDir = config.paths.photosDir;
    const results = [];

    if (!fs.existsSync(photosDir)) {
      return results;
    }

    const sessions = await fs.promises.readdir(photosDir, { withFileTypes: true });

    for (const sess of sessions) {
      if (sess.isDirectory()) {
        const sessPath = path.join(photosDir, sess.name);
        const files = await fs.promises.readdir(sessPath);

        for (const file of files) {
          const filePath = path.join(sessPath, file);
          const stat = await fs.promises.stat(filePath);
          if (stat.isFile()) {
            const fileUUID = file.replace(/^strip_|\.[^.]+$/g, '');
            results.push({
              fileId: fileUUID,
              filename: file,
              sessionId: sess.name,
              sizeBytes: stat.size,
              sizeMB: (stat.size / (1024 * 1024)).toFixed(2),
              createdAt: stat.birthtime || stat.mtime,
              viewUrl: `/api/v1/photos/view/${fileUUID}?sessionId=${sess.name}`
            });
          }
        }
      }
    }

    return results.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }

  /**
   * Deletes a specific photo file
   */
  async deletePhoto(sessionId, fileId) {
    const photoPath = await this.findPhotoPath(sessionId, fileId);
    if (photoPath && fs.existsSync(photoPath)) {
      await fs.promises.unlink(photoPath);
      return true;
    }
    return false;
  }
}

module.exports = new PhotoRepository();
