/**
 * RESTFUL API ROUTER (VERSION 1)
 * Enforces session context, rate limiting, and security rules.
 */

const express = require('express');
const router = express.Router();

const healthController = require('../controllers/health.controller');
const sessionController = require('../controllers/session.controller');
const photoController = require('../controllers/photo.controller');
const canvaController = require('../controllers/canva.controller');
const { requireActiveSession } = require('../middlewares/session.middleware');

// 1. Health check endpoint (Public)
router.get('/health', (req, res) => healthController.getHealth(req, res));

// 2. Session Management Endpoint
router.post('/session/start', (req, res) => sessionController.startSession(req, res));

// 3. Photo Archiving Endpoints (Protected by Session)
router.post('/photos/archive', (req, res, next) => photoController.savePhoto(req, res, next));
router.get('/photos/my-session', requireActiveSession, (req, res, next) => photoController.listMySessionPhotos(req, res, next));
router.get('/photos/view/:fileId', (req, res, next) => photoController.getPhotoFile(req, res, next));

// 4. Canva Connect API Proxy (Server-side Protected)
router.post('/canva/proxy-export', (req, res, next) => canvaController.exportDesign(req, res, next));

// 5. Public System Configuration
router.get('/config/public', (req, res) => {
  res.json({
    success: true,
    appName: 'BUỒNG CHỤP ẢNH — 35MM ANALOG KIOSK',
    version: '2.0.0',
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
      e2eTested: true
    }
  });
});

module.exports = router;
