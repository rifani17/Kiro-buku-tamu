'use strict';

const express = require('express');
const session = require('express-session');
const path = require('path');
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

// ── View engine ──────────────────────────────────────────────────────────────
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// ── Body parsing middleware ───────────────────────────────────────────────────
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// ── Session middleware ────────────────────────────────────────────────────────
app.use(
  session({
    secret: config.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      maxAge: 8 * 60 * 60 * 1000, // 8 hours
    },
  })
);

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
