/**
 * ADMIN CONTROLLER (PRESENTATION / HTTP LAYER)
 * Handles incoming admin requests, validates input payloads, and routes to AdminService.
 */

const adminService = require('../services/admin.service');

class AdminController {
  async getOverview(req, res, next) {
    try {
      const overview = await adminService.getDashboardOverview();
      res.json({ success: true, data: overview });
    } catch (err) {
      next(err);
    }
  }

  async getTemplates(req, res, next) {
    try {
      const templates = await adminService.getTemplates();
      res.json({ success: true, data: templates });
    } catch (err) {
      next(err);
    }
  }

  async saveTemplate(req, res, next) {
    try {
      const { name, category, tag, canvaDesignId, dataUrl, isActive } = req.body;
      if (!name) {
        return res.status(400).json({ success: false, error: 'Tên mẫu khung là bắt buộc.' });
      }

      const updated = await adminService.saveTemplate({
        id: req.body.id,
        name,
        category,
        tag,
        canvaDesignId,
        dataUrl,
        isActive
      });

      res.json({ success: true, data: updated, message: 'Đã lưu mẫu khung thành công.' });
    } catch (err) {
      next(err);
    }
  }

  async deleteTemplate(req, res, next) {
    try {
      const { id } = req.params;
      if (!id) {
        return res.status(400).json({ success: false, error: 'Thiếu ID khung cần xóa.' });
      }

      await adminService.deleteTemplate(id);
      res.json({ success: true, message: 'Đã xóa mẫu khung thành công.' });
    } catch (err) {
      next(err);
    }
  }

  async getFilters(req, res, next) {
    try {
      const filters = await adminService.getFilters();
      res.json({ success: true, data: filters });
    } catch (err) {
      next(err);
    }
  }

  async toggleFilter(req, res, next) {
    try {
      const { id } = req.params;
      const { isActive } = req.body;

      const filters = await adminService.toggleFilter(id, isActive);
      res.json({ success: true, data: filters, message: 'Đã cập nhật trạng thái bộ lọc.' });
    } catch (err) {
      next(err);
    }
  }

  async triggerCleanup(req, res, next) {
    try {
      await adminService.triggerStorageCleanup();
      res.json({ success: true, message: 'Đã thực hiện dọn dẹp bộ nhớ tạm thành công.' });
    } catch (err) {
      next(err);
    }
  }

  async getAllPhotos(req, res, next) {
    try {
      const photos = await adminService.getAllPhotos();
      res.json({ success: true, data: photos });
    } catch (err) {
      next(err);
    }
  }

  async deletePhoto(req, res, next) {
    try {
      const { sessionId, fileId } = req.params;
      const success = await adminService.deletePhoto(sessionId, fileId);
      if (!success) {
        return res.status(404).json({ success: false, error: 'Không tìm thấy file ảnh để xóa.' });
      }
      res.json({ success: true, message: 'Đã xóa file ảnh thành công.' });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new AdminController();
