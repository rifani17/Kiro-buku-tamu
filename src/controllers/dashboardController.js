'use strict';

const { getVisitsByDate, getVisitById, updateVisitStatus } = require('../models/visitModel');
const { filterByKeyword } = require('../utils/filters');
const { broadcast } = require('../services/sseManager');

/**
 * Mengembalikan tanggal hari ini dalam format YYYY-MM-DD berdasarkan waktu server.
 *
 * @returns {string} Tanggal hari ini, format YYYY-MM-DD
 */
function getTodayDate() {
  return new Date().toISOString().slice(0, 10);
}

/**
 * GET /dashboard
 * Tampilkan halaman dashboard dengan daftar kunjungan hari ini.
 *
 * Persyaratan: 3.1, 3.2, 3.4
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
function index(req, res) {
  try {
    const today = getTodayDate();
    const visits = getVisitsByDate(today);

    return res.render('dashboard/index', {
      visits,
      today,
      totalToday: visits.length,
    });
  } catch (err) {
    console.error('[DashboardController] Gagal mengambil data kunjungan hari ini:', err);
    return res.status(500).render('error', {
      message: 'Terjadi kesalahan sistem, silakan coba lagi.',
    });
  }
}

/**
 * GET /dashboard/visits?date=YYYY-MM-DD&keyword=xxx
 * Ambil daftar kunjungan dengan filter tanggal dan/atau kata kunci pencarian.
 * Mengembalikan JSON.
 *
 * Persyaratan: 3.5, 3.6
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
function getVisits(req, res) {
  try {
    const { date, keyword } = req.query;

    // Gunakan tanggal dari query, atau hari ini jika tidak ada
    const targetDate = (date && typeof date === 'string' && date.trim()) ? date.trim() : getTodayDate();

    let visits = getVisitsByDate(targetDate);

    // Terapkan filter keyword jika ada
    if (keyword && typeof keyword === 'string' && keyword.trim()) {
      visits = filterByKeyword(visits, keyword.trim());
    }

    return res.json({ visits });
  } catch (err) {
    console.error('[DashboardController] Gagal mengambil data kunjungan:', err);
    return res.status(500).json({ error: 'Terjadi kesalahan sistem, silakan coba lagi.' });
  }
}

/**
 * PATCH /dashboard/visits/:id/status
 * Perbarui status kunjungan menjadi 'Selesai', broadcast SSE status-update,
 * dan kembalikan JSON.
 *
 * Persyaratan: 6.1, 6.2, 6.3
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
function updateStatus(req, res) {
  try {
    const id = Number(req.params.id);

    const updated = updateVisitStatus(id, 'Selesai');

    if (!updated) {
      // Kunjungan tidak ditemukan atau sudah berstatus 'Selesai'
      return res.status(404).json({ error: 'Kunjungan tidak ditemukan atau status sudah Selesai.' });
    }

    const visit = getVisitById(id);

    // Broadcast SSE ke semua klien dashboard yang terhubung
    broadcast({ type: 'status-update', data: visit });

    console.info(`[DashboardController] Status kunjungan ID ${id} diperbarui menjadi 'Selesai'.`);

    return res.json({ success: true, visit });
  } catch (err) {
    console.error('[DashboardController] Gagal memperbarui status kunjungan:', err);
    return res.status(500).json({ error: 'Terjadi kesalahan sistem, silakan coba lagi.' });
  }
}

module.exports = {
  index,
  getVisits,
  updateStatus,
};
