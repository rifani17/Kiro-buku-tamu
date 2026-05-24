'use strict';

const db = require('../database');

/**
 * Menyimpan kunjungan baru ke database.
 *
 * @param {{ visitor_name: string, institution: string, purpose: string, employee_id: number }} data
 * @returns {number} ID kunjungan yang baru dibuat
 */
function insertVisit(data) {
  const stmt = db.prepare(`
    INSERT INTO visits (visitor_name, institution, purpose, employee_id)
    VALUES (@visitor_name, @institution, @purpose, @employee_id)
  `);
  const result = stmt.run(data);
  return result.lastInsertRowid;
}

/**
 * Mengambil satu kunjungan berdasarkan ID, dengan JOIN ke tabel employees.
 *
 * @param {number} id
 * @returns {{ id: number, visitor_name: string, institution: string, purpose: string,
 *             employee_id: number, employee_name: string,
 *             check_in_at: string, check_out_at: string|null,
 *             status: 'Hadir'|'Selesai' } | undefined}
 */
function getVisitById(id) {
  const stmt = db.prepare(`
    SELECT
      v.id,
      v.visitor_name,
      v.institution,
      v.purpose,
      v.employee_id,
      e.name AS employee_name,
      v.check_in_at,
      v.check_out_at,
      v.status
    FROM visits v
    JOIN employees e ON e.id = v.employee_id
    WHERE v.id = ?
  `);
  return stmt.get(id);
}

/**
 * Mengambil semua kunjungan untuk tanggal tertentu, diurutkan dari yang terbaru.
 *
 * @param {string} date - Format YYYY-MM-DD
 * @returns {Array<{ id: number, visitor_name: string, institution: string, purpose: string,
 *                   employee_id: number, employee_name: string,
 *                   check_in_at: string, check_out_at: string|null,
 *                   status: 'Hadir'|'Selesai' }>}
 */
function getVisitsByDate(date) {
  const stmt = db.prepare(`
    SELECT
      v.id,
      v.visitor_name,
      v.institution,
      v.purpose,
      v.employee_id,
      e.name AS employee_name,
      v.check_in_at,
      v.check_out_at,
      v.status
    FROM visits v
    JOIN employees e ON e.id = v.employee_id
    WHERE date(v.check_in_at) = ?
    ORDER BY v.check_in_at DESC
  `);
  return stmt.all(date);
}

/**
 * Mencari kunjungan berdasarkan keyword pada visitor_name atau nama pegawai,
 * dengan filter tanggal opsional.
 *
 * @param {string} keyword - Kata kunci pencarian
 * @param {string|null} [date] - Filter tanggal opsional (format YYYY-MM-DD)
 * @returns {Array<{ id: number, visitor_name: string, institution: string, purpose: string,
 *                   employee_id: number, employee_name: string,
 *                   check_in_at: string, check_out_at: string|null,
 *                   status: 'Hadir'|'Selesai' }>}
 */
function searchVisits(keyword, date) {
  const like = `%${keyword}%`;

  if (date) {
    const stmt = db.prepare(`
      SELECT
        v.id,
        v.visitor_name,
        v.institution,
        v.purpose,
        v.employee_id,
        e.name AS employee_name,
        v.check_in_at,
        v.check_out_at,
        v.status
      FROM visits v
      JOIN employees e ON e.id = v.employee_id
      WHERE (v.visitor_name LIKE ? OR e.name LIKE ?)
        AND date(v.check_in_at) = ?
      ORDER BY v.check_in_at DESC
    `);
    return stmt.all(like, like, date);
  }

  const stmt = db.prepare(`
    SELECT
      v.id,
      v.visitor_name,
      v.institution,
      v.purpose,
      v.employee_id,
      e.name AS employee_name,
      v.check_in_at,
      v.check_out_at,
      v.status
    FROM visits v
    JOIN employees e ON e.id = v.employee_id
    WHERE v.visitor_name LIKE ? OR e.name LIKE ?
    ORDER BY v.check_in_at DESC
  `);
  return stmt.all(like, like);
}

/**
 * Memperbarui status kunjungan. Jika status baru adalah 'Selesai',
 * check_out_at diisi dengan waktu saat ini (waktu lokal server).
 * Transisi dari 'Selesai' kembali ke 'Hadir' ditolak (tidak ada perubahan).
 *
 * @param {number} id
 * @param {'Hadir'|'Selesai'} status
 * @returns {boolean} true jika baris berhasil diperbarui, false jika tidak ada perubahan
 */
function updateVisitStatus(id, status) {
  if (status === 'Selesai') {
    const stmt = db.prepare(`
      UPDATE visits
      SET status = 'Selesai',
          check_out_at = datetime('now', 'localtime')
      WHERE id = ? AND status = 'Hadir'
    `);
    const result = stmt.run(id);
    return result.changes > 0;
  }

  // Transisi ke status selain 'Selesai' (termasuk kembali ke 'Hadir') ditolak
  return false;
}

module.exports = {
  insertVisit,
  getVisitById,
  getVisitsByDate,
  searchVisits,
  updateVisitStatus,
};
