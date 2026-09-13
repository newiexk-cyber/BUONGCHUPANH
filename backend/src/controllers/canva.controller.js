/**
 * CANVA CONTROLLER
 * RESTful endpoint proxying Canva design exports securely.
 */

const canvaService = require('../services/canva.service');

class CanvaController {
  async exportDesign(req, res, next) {
    try {
      const { designId } = req.body;

      if (!designId) {
        return res.status(400).json({
          success: false,
          error: 'Vui lòng cung cấp Design ID hoặc Link thiết kế Canva.'
        });
      }

      const result = await canvaService.exportDesign(designId);
      return res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new CanvaController();
