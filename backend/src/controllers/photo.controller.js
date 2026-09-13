/**
 * SECURE PHOTO CONTROLLER
 * RESTful endpoints enforcing Session Ownership, Magic Bytes validation, and private streaming.
 */

const photoService = require('../services/photo.service');
const path = require('path');

class PhotoController {
  /**
   * Saves a photo strip / GIF within the authenticated session
   */
  async savePhoto(req, res, next) {
    try {
      const { image, format, caption } = req.body;
      const sessionId = req.sessionId;

      if (!image) {
        return res.status(400).json({
          success: false,
          error: 'Thiếu trường dữ liệu ảnh "image" (base64 payload).'
        });
      }

      const result = await photoService.savePhoto(sessionId, image, format, caption);

      return res.status(201).json({
        success: true,
        message: 'Lưu dải ảnh an toàn vào hệ thống thành công!',
        data: result
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Lists photos belonging EXCLUSIVELY to the requester's session
   */
  async listMySessionPhotos(req, res, next) {
    try {
      const sessionId = req.sessionId;
      const photos = await photoService.listPhotosBySession(sessionId);

      return res.status(200).json({
        success: true,
        sessionId,
        count: photos.length,
        data: photos
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Streams a photo file verifying session ownership
   */
  async getPhotoFile(req, res, next) {
    try {
      const { fileId } = req.params;
      const sessionId = req.sessionId || req.query.sessionId;

      if (!sessionId) {
        return res.status(401).json({
          success: false,
          error: 'Không có quyền truy cập file ảnh (Thiếu Session ID hợp lệ).'
        });
      }

      const filePath = await photoService.getPhotoPathBySession(sessionId, fileId);

      if (!filePath) {
        return res.status(404).json({
          success: false,
          error: 'Không tìm thấy file ảnh trong phiên làm việc của bạn.'
        });
      }

      return res.sendFile(filePath);
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new PhotoController();
