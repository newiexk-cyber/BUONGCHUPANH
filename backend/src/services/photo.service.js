/**
 * SECURE PHOTO STORAGE SERVICE
 * Handles tenant-isolated storage, Magic Bytes validation, UUID naming, and safe streaming.
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const config = require('../config');
const { validateMagicBytes, detectFormat } = require('../utils/magicBytes');

class PhotoService {
  /**
   * Resolves and creates the private directory for a given session
   */
  async getSessionDir(sessionId) {
    const safeSessionId = path.basename(sessionId);
    const sessionDir = path.join(config.paths.photosDir, safeSessionId);

    if (!fs.existsSync(sessionDir)) {
      await fs.promises.mkdir(sessionDir, { recursive: true });
    }

    return sessionDir;
  }

  /**
   * Validates Magic Bytes and saves photo to private session storage
   */
  async savePhoto(sessionId, base64String, requestedFormat = 'png', caption = '') {
    if (!sessionId) {
      throw new Error('Thiếu thông tin phiên làm việc (Session ID).');
    }

    if (!base64String || typeof base64String !== 'string') {
      throw new Error('Dữ liệu ảnh base64 không hợp lệ hoặc bị thiếu.');
    }

    // 1. Extract Base64 binary payload
    const matches = base64String.match(/^data:image\/([a-zA-Z0-9-+]+);base64,(.+)$/);
    let dataBuffer;

    if (matches && matches.length === 3) {
      dataBuffer = Buffer.from(matches[2], 'base64');
    } else {
      dataBuffer = Buffer.from(base64String.replace(/^data:image\/\w+;base64,/, ''), 'base64');
    }

    // 2. Enforce synchronized payload size limit (35MB)
    if (dataBuffer.length > config.payload.maxBytes) {
      throw new Error(`Kích thước ảnh vượt quá giới hạn cho phép (tối đa ${config.payload.limitString}).`);
    }

    // 3. Authenticate binary data via Magic Bytes
    const detectedExt = detectFormat(dataBuffer);
    if (!detectedExt) {
      throw new Error('Dữ liệu tải lên không phải định dạng ảnh hợp lệ (Magic bytes verification failed).');
    }

    const ext = detectedExt;
    const sessionDir = await this.getSessionDir(sessionId);

    // 4. Generate unique UUID v4 filename (collision-free)
    const fileUUID = crypto.randomUUID ? crypto.randomUUID() : crypto.randomBytes(16).toString('hex');
    const filename = `strip_${fileUUID}.${ext}`;
    const filePath = path.join(sessionDir, filename);

    await fs.promises.writeFile(filePath, dataBuffer);

    return {
      fileId: fileUUID,
      filename,
      sessionId,
      sizeBytes: dataBuffer.length,
      format: ext,
      caption: caption || '',
      createdAt: new Date().toISOString(),
      downloadUrl: `/api/v1/photos/view/${fileUUID}?sessionId=${sessionId}`
    };
  }

  /**
   * Retrieves photos strictly belonging to the caller's session
   */
  async listPhotosBySession(sessionId) {
    const sessionDir = await this.getSessionDir(sessionId);
    const files = await fs.promises.readdir(sessionDir);
    const photos = [];

    for (const file of files) {
      const filePath = path.join(sessionDir, file);
      const stat = await fs.promises.stat(filePath);

      if (stat.isFile()) {
        const fileUUID = file.replace(/^strip_|\.[^.]+$/g, '');
        photos.push({
          fileId: fileUUID,
          filename: file,
          sessionId,
          sizeBytes: stat.size,
          createdAt: stat.birthtime || stat.mtime,
          downloadUrl: `/api/v1/photos/view/${fileUUID}?sessionId=${sessionId}`
        });
      }
    }

    return photos.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }

  /**
   * Safely retrieves photo file path verifying session ownership
   */
  async getPhotoPathBySession(sessionId, fileUUID) {
    if (!sessionId || !fileUUID) return null;

    const safeSessionId = path.basename(sessionId);
    const safeUUID = path.basename(fileUUID);
    const sessionDir = path.join(config.paths.photosDir, safeSessionId);

    if (!fs.existsSync(sessionDir)) return null;

    const files = await fs.promises.readdir(sessionDir);
    const targetFile = files.find(f => f.includes(safeUUID));

    if (!targetFile) return null;

    return path.join(sessionDir, targetFile);
  }
}

module.exports = new PhotoService();
