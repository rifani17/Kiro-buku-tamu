'use strict';

const express = require('express');
const session = require('express-session');
const path = require('path');
const csrf = require('csurf');
const rateLimit = require('express-rate-limit');
const config = require('./config');
const db = require('./database');
const runMigration = require('./migrations/001_initial_schema');
const runSeed = require('./migrations/seed');

// Jalankan migrasi dan seed saat startup
try {
  runMigration(db);
  runSeed(db);
} catch (err) {
  console.error('Gagal menjalankan migrasi/seed:', err);
}

const app = express();

// ── Trust proxy (for rate limiting behind reverse proxy) ──────────────────────
app.set('trust proxy', 1);

// ── View engine ──────────────────────────────────────────────────────────────
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// ── Body parsing middleware ───────────────────────────────────────────────────
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// ── Rate limiting ─────────────────────────────────────────────────────────────
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 requests per windowMs
  message: { error: 'Terlalu banyak percobaan login. Coba lagi nanti.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const visitLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // limit each IP to 10 requests per minute
  message: { error: 'Terlalu banyak permintaan. Coba lagi sebentar.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// ── Session middleware ────────────────────────────────────────────────────────
app.use(
  session({
    secret: config.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production', // only secure in production
      sameSite: 'lax',
      maxAge: 8 * 60 * 60 * 1000, // 8 hours
    },
  })
);

// ── CSRF protection ───────────────────────────────────────────────────────────
// Skip CSRF in test environment
if (process.env.NODE_ENV !== 'test') {
  // Apply CSRF to all routes except SSE (which is a persistent connection)
  const csrfProtection = csrf({ cookie: false });
  app.use((req, res, next) => {
    // Skip CSRF for SSE endpoint (long-lived connection)
    if (req.path === '/dashboard/events') {
      return next();
    }
    csrfProtection(req, res, next);
  });

  // CSRF error handler - provide friendly error message
  app.use((err, req, res, next) => {
    if (err.code === 'EBADCSRFTOKEN') {
      console.warn('[CSRF] Invalid token from IP:', req.ip, 'Path:', req.path);
      if (req.accepts('json')) {
        return res.status(403).json({ error: 'Token CSRF tidak valid. Silakan refresh halaman dan coba lagi.' });
      }
      return res.status(403).render('error', {
        status: 403,
        message: 'Token keamanan tidak valid. Silakan refresh halaman dan coba lagi.',
      });
    }
    next(err);
  });
}

// Make CSRF token available to all views
app.use((req, res, next) => {
  res.locals.csrfToken = req.csrfToken ? req.csrfToken() : '';
  next();
});

// ── Static files ──────────────────────────────────────────────────────────────
app.use(express.static(path.join(__dirname, '..', 'public')));

// ── Routes ────────────────────────────────────────────────────────────────────
const router = require('./routes/index');
app.use(router);

// ── 404 handler ───────────────────────────────────────────────────────────────
app.use((req, res) => {
  if (req.accepts('html')) {
    return res.status(404).render('error', {
      status: 404,
      message: 'Halaman tidak ditemukan',
    });
  }
  res.status(404).json({ error: 'Halaman tidak ditemukan' });
});

// ── Global error handler ──────────────────────────────────────────────────────
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  if (req.accepts('html')) {
    return res.status(500).render('error', {
      status: 500,
      message: 'Terjadi kesalahan pada server',
    });
  }
  res.status(500).json({ error: 'Terjadi kesalahan pada server' });
});

// ── Start server (only when run directly, not when required by tests) ─────────
if (require.main === module) {
  app.listen(config.PORT, () => {
    console.info(`Server berjalan di http://localhost:${config.PORT}`);
  });
}

module.exports = app;
