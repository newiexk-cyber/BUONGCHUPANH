/**
 * PHOTO ARCHIVE SERVICE
 * Handles validation, disk storage, and metadata management for photos and GIFs.
 */

const fs = require('fs');
const path = require('path');
const config = require('../config');

class PhotoService {
  /**
   * Validates and saves Base64 photo/GIF to disk
   */
  async savePhoto(base64String, format = 'png', caption = '') {
    if (!base64String || typeof base64String !== 'string') {
      throw new Error('Dữ liệu ảnh base64 không hợp lệ hoặc bị thiếu.');
    }

    // Sanitize and extract base64 payload
    const matches = base64String.match(/^data:image\/([a-zA-Z0-9-+]+);base64,(.+)$/);
    let ext = format.toLowerCase();
    let dataBuffer;

    if (matches && matches.length === 3) {
      ext = matches[1] === 'jpeg' ? 'jpg' : matches[1];
      dataBuffer = Buffer.from(matches[2], 'base64');
    } else {
      dataBuffer = Buffer.from(base64String.replace(/^data:image\/\w+;base64,/, ''), 'base64');
    }

    // Validate size (limit max 25MB)
    if (dataBuffer.length > 25 * 1024 * 1024) {
      throw new Error('Kích thước ảnh vượt quá giới hạn cho phép (tối đa 25MB).');
    }

    const timestamp = Date.now();
    const filename = `photo_strip_${timestamp}.${ext}`;
    const filePath = path.join(config.paths.storageDir, filename);

    await fs.promises.writeFile(filePath, dataBuffer);

    return {
      filename,
      sizeBytes: dataBuffer.length,
      format: ext,
      caption,
      createdAt: new Date().toISOString(),
      url: `/api/v1/photos/archive/${filename}`
    };
  }

  /**
   * Retrieves list of saved photos from storage
   */
  async listPhotos() {
    const files = await fs.promises.readdir(config.paths.storageDir);
    const photos = [];

    for (const file of files) {
      const filePath = path.join(config.paths.storageDir, file);
      const stat = await fs.promises.stat(filePath);

      if (stat.isFile()) {
        photos.push({
          filename: file,
          sizeBytes: stat.size,
          createdAt: stat.birthtime || stat.mtime,
          url: `/api/v1/photos/archive/${file}`
        });
      }
    }

    return photos.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }

  /**
   * Returns safe path to photo file with directory traversal protection
   */
  getPhotoPath(filename) {
    // Sanitize filename to prevent directory traversal
    const safeName = path.basename(filename);
    const fullPath = path.join(config.paths.storageDir, safeName);

    if (!fs.existsSync(fullPath)) {
      return null;
    }

    return fullPath;
  }
}

module.exports = new PhotoService();
