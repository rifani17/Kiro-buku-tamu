'use strict';

const db = require('../database');
const bcrypt = require('bcrypt');

const BCRYPT_COST_FACTOR = 12;

/**
 * Mengambil satu user berdasarkan username.
 * Digunakan untuk proses autentikasi petugas.
 *
 * @param {string} username
 * @returns {{ id: number, username: string, password: string, name: string } | undefined}
 */
function getUserByUsername(username) {
  const stmt = db.prepare(`
    SELECT id, username, password, name
    FROM users
    WHERE username = ?
  `);
  return stmt.get(username);
}

/**
 * Menghasilkan bcrypt hash dari password plaintext.
 * Menggunakan cost factor 12 sesuai standar keamanan.
 *
 * @param {string} plaintext - Password dalam bentuk teks biasa
 * @returns {Promise<string>} bcrypt hash dari password
 */
async function hashPassword(plaintext) {
  return bcrypt.hash(plaintext, BCRYPT_COST_FACTOR);
}

module.exports = {
  getUserByUsername,
  hashPassword,
};
