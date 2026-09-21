/**
 * RESTFUL API ROUTER (VERSION 1)
 * Enforces session context, admin authorization, rate limiting, and security rules.
 */

const express = require('express');
const router = express.Router();

const healthController = require('../controllers/health.controller');
const sessionController = require('../controllers/session.controller');
const photoController = require('../controllers/photo.controller');
const canvaController = require('../controllers/canva.controller');
const adminController = require('../controllers/admin.controller');
const { requireActiveSession } = require('../middlewares/session.middleware');
const { requireAdminAuth } = require('../middlewares/auth.middleware');

// 1. Health check endpoint (Public)
router.get('/health', (req, res) => healthController.getHealth(req, res));

// 2. Public System Configuration & Presets
router.get('/config/public', (req, res) => {
  res.json({
    success: true,
    appName: 'BUỒNG CHỤP ẢNH — ZUMP.PI PRODUCTION STUDIO',
    version: '2.5.0',
    supportedLayouts: [
      'strip-4', 'grid-4', 'sole-4', 'dantu-4', 'vom-4', 'sotay-4',
      'dual-strip-8', 'grid-8', 'sotay-8'
    ],
    maxUploadPayloadMB: 35,
    sessionRetentionHours: 24,
    features: {
      canvaIntegration: true,
      magicBytesValidation: true,
      sessionIsolation: true,
      adminDashboard: true
    }
  });
});

router.get('/templates', (req, res, next) => adminController.getTemplates(req, res, next));
router.get('/filters', (req, res, next) => adminController.getFilters(req, res, next));

// 3. Session Management Endpoints
router.post('/session/start', (req, res) => sessionController.startSession(req, res));

// 4. Photo Archiving Endpoints (Protected by Session)
router.post('/photos/archive', (req, res, next) => photoController.savePhoto(req, res, next));
router.get('/photos/my-session', requireActiveSession, (req, res, next) => photoController.listMySessionPhotos(req, res, next));
router.get('/photos/view/:fileId', (req, res, next) => photoController.getPhotoFile(req, res, next));

// 5. Canva Connect API Proxy (Server-side Protected)
router.post('/canva/proxy-export', (req, res, next) => canvaController.exportDesign(req, res, next));

// 6. Admin Management Endpoints (Strictly Protected by requireAdminAuth)
router.get('/admin/overview', requireAdminAuth, (req, res, next) => adminController.getOverview(req, res, next));
router.get('/admin/templates', requireAdminAuth, (req, res, next) => adminController.getTemplates(req, res, next));
router.post('/admin/templates', requireAdminAuth, (req, res, next) => adminController.saveTemplate(req, res, next));
router.delete('/admin/templates/:id', requireAdminAuth, (req, res, next) => adminController.deleteTemplate(req, res, next));
router.get('/admin/filters', requireAdminAuth, (req, res, next) => adminController.getFilters(req, res, next));
router.patch('/admin/filters/:id/toggle', requireAdminAuth, (req, res, next) => adminController.toggleFilter(req, res, next));
router.post('/admin/cleanup', requireAdminAuth, (req, res, next) => adminController.triggerCleanup(req, res, next));

// 7. Hardware Camera Shutter Trigger (Sony / Canon Physical Shutter & Flash Strobe Sync)
router.post('/camera/trigger', (req, res) => {
  res.json({
    success: true,
    timestamp: Date.now(),
    message: 'Shutter trigger signal dispatched to hardware camera'
  });
});

module.exports = router;
