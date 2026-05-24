'use strict';

const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');
const config = require('./config');

function ensureDir(filePath) {
  const dir = path.dirname(filePath);
  fs.mkdirSync(dir, { recursive: true });
}

function verifyWritable(db) {
  // Probe ringan untuk memastikan file database benar-benar bisa ditulis.
  // Beberapa drive Windows bisa membuka file, tetapi gagal saat operasi write.
  db.exec(`
    CREATE TABLE IF NOT EXISTS __codex_db_probe (
      id INTEGER PRIMARY KEY
    );
    DROP TABLE __codex_db_probe;
  `);
}

function openDatabase(filePath) {
  ensureDir(filePath);
  const db = new Database(filePath);

  try {
    verifyWritable(db);
    return db;
  } catch (err) {
    db.close();
    throw err;
  }
}

function getFallbackPath() {
  const home = process.env.USERPROFILE || process.env.HOME || __dirname;
  return path.join(home, '.codex', 'memories', 'buku_tamu.db');
}

let db;

try {
  db = openDatabase(config.DB_PATH);
} catch (primaryErr) {
  const fallbackPath = getFallbackPath();
  console.warn(
    `[database] Gagal membuka DB di "${config.DB_PATH}", pindah ke fallback "${fallbackPath}": ${primaryErr.message}`
  );
  db = openDatabase(fallbackPath);
  db.__dbPath = fallbackPath;
}

// Coba aktifkan WAL mode untuk performa lebih baik.
// Pada beberapa storage/drive Windows, WAL bisa gagal dibuka.
// Untuk MVP, fallback ke mode default agar aplikasi tetap bisa berjalan.
try {
  db.pragma('journal_mode = WAL');
} catch (err) {
  console.warn('[database] WAL mode gagal diaktifkan, lanjutkan tanpa WAL:', err.message);
}

module.exports = db;
