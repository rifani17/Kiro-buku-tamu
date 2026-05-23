'use strict';

/**
 * Migrasi awal: membuat tabel users, employees, dan visits.
 * Menggunakan CREATE TABLE IF NOT EXISTS agar idempoten (aman dijalankan berulang kali).
 *
 * @param {import('better-sqlite3').Database} db - Instance better-sqlite3
 */
function runMigration(db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
        id          INTEGER PRIMARY KEY AUTOINCREMENT,
        username    TEXT    NOT NULL UNIQUE,
        password    TEXT    NOT NULL,
        name        TEXT    NOT NULL,
        created_at  TEXT    NOT NULL DEFAULT (datetime('now', 'localtime'))
    );

    CREATE TABLE IF NOT EXISTS employees (
        id           INTEGER PRIMARY KEY AUTOINCREMENT,
        name         TEXT    NOT NULL,
        department   TEXT    NOT NULL,
        whatsapp_no  TEXT,
        created_at   TEXT    NOT NULL DEFAULT (datetime('now', 'localtime'))
    );

    CREATE TABLE IF NOT EXISTS visits (
        id            INTEGER PRIMARY KEY AUTOINCREMENT,
        visitor_name  TEXT    NOT NULL,
        institution   TEXT    NOT NULL,
        purpose       TEXT    NOT NULL,
        employee_id   INTEGER NOT NULL REFERENCES employees(id),
        check_in_at   TEXT    NOT NULL DEFAULT (datetime('now', 'localtime')),
        check_out_at  TEXT,
        status        TEXT    NOT NULL DEFAULT 'Hadir'
                              CHECK(status IN ('Hadir', 'Selesai')),
        created_at    TEXT    NOT NULL DEFAULT (datetime('now', 'localtime'))
    );
  `);
}

module.exports = runMigration;
module.exports.default = runMigration;
