'use strict';

const db = require('../database');

/**
 * Mengambil semua pegawai, diurutkan berdasarkan nama.
 * Digunakan untuk mengisi dropdown tujuan kunjungan pada form tamu.
 *
 * @returns {Array<{ id: number, name: string, department: string, whatsapp_no: string|null }>}
 */
function getAllEmployees() {
  const stmt = db.prepare(`
    SELECT id, name, department, whatsapp_no
    FROM employees
    ORDER BY name ASC
  `);
  return stmt.all();
}

/**
 * Mengambil satu pegawai berdasarkan ID.
 * Digunakan untuk mendapatkan nomor WhatsApp tujuan notifikasi.
 *
 * @param {number} id
 * @returns {{ id: number, name: string, department: string, whatsapp_no: string|null } | undefined}
 */
function getEmployeeById(id) {
  const stmt = db.prepare(`
    SELECT id, name, department, whatsapp_no
    FROM employees
    WHERE id = ?
  `);
  return stmt.get(id);
}

module.exports = {
  getAllEmployees,
  getEmployeeById,
};
