/**
 * PHOTO SERVICE (BUSINESS LOGIC LAYER)
 * Handles Magic Bytes validation, UUID naming, payload security, and delegates to PhotoRepository.
 */

const crypto = require('crypto');
const config = require('../config');
const { detectFormat } = require('../utils/magicBytes');
const photoRepository = require('../repositories/photo.repository');

class PhotoService {
  /**
   * Validates Magic Bytes and saves photo to private session storage via repository
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

    // 4. Generate unique UUID v4 filename (collision-free)
    const fileUUID = crypto.randomUUID ? crypto.randomUUID() : crypto.randomBytes(16).toString('hex');
    const filename = `strip_${fileUUID}.${ext}`;

    // 5. Delegate storage I/O to Repository layer
    const filePath = await photoRepository.writePhotoFile(sessionId, filename, dataBuffer);

    return {
      fileId: fileUUID,
      filename,
      savedPath: filePath,
      sessionId,
      sizeBytes: dataBuffer.length,
      format: ext,
      caption: caption || '',
      createdAt: new Date().toISOString(),
      downloadUrl: `/api/v1/photos/view/${fileUUID}?sessionId=${sessionId}`
    };
  }

  /**
   * Retrieves photos strictly belonging to the caller's session via repository
   */
  async listPhotosBySession(sessionId) {
    const photos = await photoRepository.listSessionPhotos(sessionId);
    return photos.map(p => ({
      ...p,
      downloadUrl: `/api/v1/photos/view/${p.fileId}?sessionId=${sessionId}`
    })).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }

  /**
   * Safely retrieves photo file path verifying session ownership via repository
   */
  async getPhotoPathBySession(sessionId, fileUUID) {
    return photoRepository.findPhotoPath(sessionId, fileUUID);
  }
}

module.exports = new PhotoService();
