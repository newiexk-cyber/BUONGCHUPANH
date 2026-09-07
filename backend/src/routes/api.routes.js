/**
 * CENTRAL RESTful API ROUTER (VERSION 1)
 */

const express = require('express');
const router = express.Router();

const healthController = require('../controllers/health.controller');
const photoController = require('../controllers/photo.controller');
const canvaController = require('../controllers/canva.controller');

// 1. Health check endpoint
router.get('/health', (req, res) => healthController.getHealth(req, res));

// 2. Photo Archiving Endpoints
router.post('/photos/archive', (req, res, next) => photoController.savePhoto(req, res, next));
router.get('/photos/archive', (req, res, next) => photoController.listPhotos(req, res, next));
router.get('/photos/archive/:filename', (req, res, next) => photoController.getPhotoFile(req, res, next));

// 3. Canva Connect API Proxy Endpoints
router.post('/canva/proxy-export', (req, res, next) => canvaController.exportDesign(req, res, next));

// 4. Public System Config
router.get('/config/public', (req, res) => {
  res.json({
    success: true,
    appName: 'BUỒNG CHỤP ẢNH — 35MM ANALOG KIOSK',
    version: '1.0.0',
    supportedLayouts: ['strip-4', 'grid-4', 'sole-4', 'dantu-4', 'vom-4', 'sotay-4', 'dual-strip-8', 'grid-8', 'sotay-8'],
    maxUploadPayloadMB: 25
  });
});

module.exports = router;
