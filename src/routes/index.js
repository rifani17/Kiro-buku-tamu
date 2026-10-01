'use strict';

const { Router } = require('express');
const rateLimit = require('express-rate-limit');

const visitorController = require('../controllers/visitorController');
const authController = require('../controllers/authController');
const dashboardController = require('../controllers/dashboardController');
const { requireAuth } = require('../middleware/auth');
const { addClient } = require('../services/sseManager');

const router = Router();

// Rate limiters (defined here to avoid circular dependency with app.js)
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { error: 'Terlalu banyak percobaan login. Coba lagi nanti.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const visitLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: { error: 'Terlalu banyak permintaan. Coba lagi sebentar.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// ---------------------------------------------------------------------------
// Route Publik — Form Tamu
// Persyaratan: 1.1, 1.2, 1.4, 1.5
// ---------------------------------------------------------------------------
router.get('/', visitorController.showForm);
router.post('/visits', visitLimiter, visitorController.submitForm);
router.get('/visits/confirm', visitorController.showConfirm);

// ---------------------------------------------------------------------------
// Route Autentikasi
// Persyaratan: 2.1, 2.5
// ---------------------------------------------------------------------------
router.get('/auth/login', authController.showLogin);
router.post('/auth/login', loginLimiter, authController.processLogin);
router.post('/auth/logout', requireAuth, authController.logout);

// ---------------------------------------------------------------------------
// Route Dashboard — Dilindungi requireAuth
// Persyaratan: 2.1, 2.5, 3.1, 3.5, 3.6, 6.1, 6.2
// ---------------------------------------------------------------------------
router.get('/dashboard', requireAuth, dashboardController.index);
router.get('/dashboard/visits', requireAuth, dashboardController.getVisits);
router.patch('/dashboard/visits/:id/status', requireAuth, dashboardController.updateStatus);

// Route SSE — real-time update dashboard
// Persyaratan: 3.3
router.get('/dashboard/events', requireAuth, addClient);

module.exports = router;
