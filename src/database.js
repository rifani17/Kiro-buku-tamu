'use strict';

const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');
const config = require('./config');

// Pastikan direktori data/ ada sebelum membuka database
const dbDir = path.dirname(config.DB_PATH);
fs.mkdirSync(dbDir, { recursive: true });

// Buka (atau buat) file database SQLite
const db = new Database(config.DB_PATH);

// Aktifkan WAL mode untuk performa lebih baik pada concurrent reads
db.pragma('journal_mode = WAL');

module.exports = db;
