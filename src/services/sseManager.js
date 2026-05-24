/**
 * SSE Manager
 * Mengelola koneksi Server-Sent Events untuk real-time update dashboard.
 *
 * Mendukung event:
 *   - new-visit     : dikirim saat tamu baru terdaftar
 *   - status-update : dikirim saat status kunjungan diperbarui
 */

/** @type {Set<import('http').ServerResponse>} */
const clients = new Set();

/**
 * Daftarkan koneksi SSE baru ke daftar klien aktif.
 * Mengatur header SSE yang diperlukan dan menambahkan listener untuk
 * membersihkan koneksi saat klien terputus.
 *
 * @param {import('http').IncomingMessage} req  - Request object (untuk mendeteksi 'close')
 * @param {import('http').ServerResponse}  res  - Response object yang akan digunakan sebagai stream SSE
 */
function addClient(req, res) {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  // Kirim komentar awal agar koneksi tidak di-timeout oleh proxy/browser
  res.write(': connected\n\n');

  clients.add(res);
  console.info(`[SSE] Klien terhubung. Total klien aktif: ${clients.size}`);

  // Bersihkan koneksi saat klien terputus
  req.on('close', () => {
    removeClient(res);
  });
}

/**
 * Hapus koneksi SSE yang terputus dari daftar klien aktif.
 *
 * @param {import('http').ServerResponse} res - Response object yang akan dihapus
 */
function removeClient(res) {
  clients.delete(res);
  console.info(`[SSE] Klien terputus. Total klien aktif: ${clients.size}`);
}

/**
 * Kirim event ke semua klien SSE yang terdaftar.
 * Klien yang gagal menerima data akan dihapus secara otomatis.
 *
 * @param {{ type: 'new-visit' | 'status-update', data: object }} eventData
 */
function broadcast(eventData) {
  const payload = `data: ${JSON.stringify(eventData)}\n\n`;

  clients.forEach((res) => {
    try {
      res.write(payload);
    } catch (err) {
      // Koneksi sudah tidak valid — hapus dari daftar
      console.warn('[SSE] Gagal mengirim ke klien, menghapus dari daftar:', err.message);
      removeClient(res);
    }
  });

  console.info(`[SSE] Broadcast event '${eventData.type}' ke ${clients.size} klien.`);
}

module.exports = { addClient, removeClient, broadcast };
