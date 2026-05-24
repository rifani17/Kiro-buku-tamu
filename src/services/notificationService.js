'use strict';

const axios = require('axios');
const config = require('../config');

/**
 * Format pesan notifikasi WhatsApp dari data kunjungan.
 * @param {Object} visit - Data kunjungan
 * @param {string} visit.visitor_name - Nama lengkap pengunjung
 * @param {string} visit.institution - Instansi/asal pengunjung
 * @param {string} visit.purpose - Keperluan kunjungan
 * @param {string} visit.check_in_at - Waktu masuk (ISO datetime string)
 * @returns {string} Pesan notifikasi yang sudah diformat
 */
function formatNotificationMessage(visit) {
  return (
    `*Notifikasi Tamu Baru*\n\n` +
    `Nama       : ${visit.visitor_name}\n` +
    `Instansi   : ${visit.institution}\n` +
    `Keperluan  : ${visit.purpose}\n` +
    `Waktu Masuk: ${visit.check_in_at}`
  );
}

/**
 * Kirim notifikasi WhatsApp ke pegawai tujuan kunjungan.
 * Fungsi ini TIDAK melempar exception — semua error ditangani secara graceful.
 *
 * @param {Object} visit - Data kunjungan (lihat formatNotificationMessage)
 * @param {Object} employee - Data pegawai tujuan
 * @param {string|null} employee.whatsapp_no - Nomor WA pegawai, atau null jika tidak ada
 * @param {string} employee.name - Nama pegawai
 * @returns {Promise<void>}
 */
async function sendVisitNotification(visit, employee) {
  // Persyaratan 5.5: Lewati pengiriman jika pegawai tidak memiliki nomor WA
  if (!employee || !employee.whatsapp_no) {
    console.info(
      `[NotificationService] Pegawai "${employee && employee.name}" tidak memiliki nomor WhatsApp. Notifikasi dilewati.`
    );
    return;
  }

  const message = formatNotificationMessage(visit);

  try {
    // Persyaratan 5.1: Kirim HTTP POST ke WhatsApp Gateway
    const response = await axios.post(config.WA_GATEWAY_URL, {
      phone: employee.whatsapp_no,
      message,
    });

    console.info(
      `[NotificationService] Notifikasi berhasil dikirim ke ${employee.whatsapp_no} (pegawai: "${employee.name}"). Status: ${response.status}`
    );
  } catch (err) {
    // Persyaratan 5.3: Catat kegagalan di log, jangan batalkan proses registrasi
    console.warn(
      `[NotificationService] Gagal mengirim notifikasi WA ke ${employee.whatsapp_no} (pegawai: "${employee.name}"): ${err.message}`
    );
  }
}

module.exports = {
  formatNotificationMessage,
  sendVisitNotification,
};
