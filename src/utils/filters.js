'use strict';

/**
 * Modul filter pencarian dan tanggal untuk data kunjungan.
 *
 * Semua fungsi di modul ini adalah pure functions yang beroperasi
 * pada array kunjungan di memori (tanpa akses database).
 */

/**
 * Mengekstrak bagian tanggal (YYYY-MM-DD) dari string datetime.
 *
 * Mendukung format ISO datetime seperti "2024-01-15 10:30:00"
 * maupun "2024-01-15T10:30:00".
 *
 * @param {string} datetime - String datetime ISO
 * @returns {string} Bagian tanggal dalam format YYYY-MM-DD, atau string kosong jika tidak valid
 */
function extractDate(datetime) {
  if (!datetime || typeof datetime !== 'string') return '';
  // Ambil 10 karakter pertama: "YYYY-MM-DD"
  return datetime.slice(0, 10);
}

/**
 * Memfilter array kunjungan berdasarkan kata kunci pencarian.
 *
 * Pencarian bersifat case-insensitive dan dilakukan pada field
 * `visitor_name` ATAU `employee_name`.
 *
 * @param {Array<Object>} visits - Array objek kunjungan
 * @param {string} keyword - Kata kunci pencarian
 * @returns {Array<Object>} Array kunjungan yang cocok dengan kata kunci
 */
function filterByKeyword(visits, keyword) {
  if (!Array.isArray(visits)) return [];
  if (!keyword || typeof keyword !== 'string' || keyword.trim() === '') {
    return visits;
  }

  const lowerKeyword = keyword.toLowerCase();

  return visits.filter((visit) => {
    const visitorName = (visit.visitor_name || '').toLowerCase();
    const employeeName = (visit.employee_name || '').toLowerCase();
    return visitorName.includes(lowerKeyword) || employeeName.includes(lowerKeyword);
  });
}

/**
 * Memfilter array kunjungan berdasarkan tanggal check-in.
 *
 * Membandingkan bagian tanggal dari `check_in_at` dengan tanggal
 * yang diberikan dalam format YYYY-MM-DD.
 *
 * @param {Array<Object>} visits - Array objek kunjungan
 * @param {string} date - Tanggal dalam format YYYY-MM-DD
 * @returns {Array<Object>} Array kunjungan yang check_in_at-nya jatuh pada tanggal tersebut
 */
function filterByDate(visits, date) {
  if (!Array.isArray(visits)) return [];
  if (!date || typeof date !== 'string' || date.trim() === '') {
    return visits;
  }

  return visits.filter((visit) => {
    return extractDate(visit.check_in_at) === date;
  });
}

module.exports = { filterByKeyword, filterByDate };
