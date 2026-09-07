/**
 * PHOTO CONTROLLER
 * RESTful endpoints for photo archiving, listing, and download.
 */

const photoService = require('../services/photo.service');
const path = require('path');

class PhotoController {
  async savePhoto(req, res, next) {
    try {
      const { image, format, caption } = req.body;

      if (!image) {
        return res.status(400).json({
          success: false,
          error: 'Thiếu trường dữ liệu ảnh "image" (base64 string).'
        });
      }

      const result = await photoService.savePhoto(image, format, caption);

      return res.status(201).json({
        success: true,
        message: 'Lưu ảnh thành phẩm thành công vào hệ thống!',
        data: result
      });
    } catch (err) {
      next(err);
    }
  }

  async listPhotos(req, res, next) {
    try {
      const photos = await photoService.listPhotos();
      return res.status(200).json({
        success: true,
        count: photos.length,
        data: photos
      });
    } catch (err) {
      next(err);
    }
  }

  async getPhotoFile(req, res, next) {
    try {
      const { filename } = req.params;
      const filePath = photoService.getPhotoPath(filename);

      if (!filePath) {
        return res.status(404).json({
          success: false,
          error: 'Không tìm thấy file ảnh yêu cầu trên máy chủ.'
        });
      }

      return res.sendFile(filePath);
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new PhotoController();
