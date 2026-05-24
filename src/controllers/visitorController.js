'use strict';

const { getAllEmployees, getEmployeeById } = require('../models/employeeModel');
const { insertVisit, getVisitById } = require('../models/visitModel');
const { sendVisitNotification } = require('../services/notificationService');
const { broadcast } = require('../services/sseManager');
const { validateVisitForm } = require('../utils/validation');

/**
 * GET /
 * Tampilkan form pengisian tamu dengan daftar pegawai.
 *
 * Persyaratan: 1.1
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
function showForm(req, res) {
  try {
    const employees = getAllEmployees();
    res.render('visitor/form', { employees, errors: null, values: {} });
  } catch (err) {
    console.error('[VisitorController] Gagal mengambil daftar pegawai:', err);
    res.status(500).render('error', {
      message: 'Terjadi kesalahan sistem, silakan coba lagi.',
    });
  }
}

/**
 * POST /visits
 * Proses pengiriman form tamu: validasi, simpan ke DB, kirim notifikasi WA,
 * broadcast SSE, lalu redirect ke halaman konfirmasi.
 *
 * Persyaratan: 1.2, 1.3, 1.4, 1.5, 1.6, 4.3, 5.1
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
async function submitForm(req, res) {
  const body = req.body;

  // Langkah 1: Validasi input form (field wajib & panjang)
  const { valid, errors } = validateVisitForm(body);

  if (!valid) {
    // Persyaratan 1.2, 1.3: Tampilkan ulang form dengan pesan error
    try {
      const employees = getAllEmployees();
      return res.status(422).render('visitor/form', {
        employees,
        errors,
        values: body,
      });
    } catch (dbErr) {
      console.error('[VisitorController] Gagal mengambil daftar pegawai saat re-render form:', dbErr);
      return res.status(500).render('error', {
        message: 'Terjadi kesalahan sistem, silakan coba lagi.',
      });
    }
  }

  // Langkah 2: Validasi employee_id ada di database
  let employee;
  try {
    employee = getEmployeeById(Number(body.employee_id));
  } catch (dbErr) {
    console.error('[VisitorController] Gagal memeriksa pegawai:', dbErr);
    return res.status(500).render('error', {
      message: 'Terjadi kesalahan sistem, silakan coba lagi.',
    });
  }

  if (!employee) {
    // employee_id valid secara format tapi tidak ada di DB
    try {
      const employees = getAllEmployees();
      return res.status(422).render('visitor/form', {
        employees,
        errors: {
          visitor_name: null,
          institution: null,
          purpose: null,
          employee_id: 'Tujuan kunjungan tidak valid',
        },
        values: body,
      });
    } catch (dbErr) {
      console.error('[VisitorController] Gagal mengambil daftar pegawai saat re-render form:', dbErr);
      return res.status(500).render('error', {
        message: 'Terjadi kesalahan sistem, silakan coba lagi.',
      });
    }
  }

  // Langkah 3: Simpan kunjungan ke database
  let visitId;
  try {
    visitId = insertVisit({
      visitor_name: String(body.visitor_name).trim(),
      institution: String(body.institution).trim(),
      purpose: String(body.purpose).trim(),
      employee_id: Number(body.employee_id),
    });
  } catch (dbErr) {
    // Persyaratan 4.3: Catat kegagalan dan tampilkan pesan error
    console.error('[VisitorController] Gagal menyimpan kunjungan ke database:', dbErr);
    return res.status(500).render('error', {
      message: 'Terjadi kesalahan sistem, silakan coba lagi.',
    });
  }

  // Langkah 4: Ambil data kunjungan lengkap (dengan JOIN employee_name)
  let visit;
  try {
    visit = getVisitById(visitId);
  } catch (dbErr) {
    console.error('[VisitorController] Gagal mengambil data kunjungan setelah insert:', dbErr);
    return res.status(500).render('error', {
      message: 'Terjadi kesalahan sistem, silakan coba lagi.',
    });
  }

  // Langkah 5: Kirim notifikasi WA secara async (non-blocking)
  // Persyaratan 5.1, 5.3: Tidak di-await dan tidak di-catch di sini —
  // sendVisitNotification menangani error-nya sendiri secara graceful.
  sendVisitNotification(visit, employee);

  // Langkah 6: Broadcast SSE ke semua klien dashboard yang terhubung
  // Persyaratan 3.3: Update real-time tanpa reload halaman
  broadcast({ type: 'new-visit', data: visit });

  // Langkah 7: Simpan data kunjungan di session untuk halaman konfirmasi
  req.session.lastVisit = visit;

  // Langkah 8: Redirect ke halaman konfirmasi
  // Persyaratan 1.5: Tampilkan pesan konfirmasi keberhasilan
  return res.redirect('/visits/confirm');
}

/**
 * GET /visits/confirm
 * Tampilkan halaman konfirmasi setelah pengisian form berhasil.
 *
 * Persyaratan: 1.5
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
function showConfirm(req, res) {
  const visit = req.session.lastVisit || null;
  res.render('visitor/confirm', { visit });
}

module.exports = {
  showForm,
  submitForm,
  showConfirm,
};
