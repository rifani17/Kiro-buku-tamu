'use strict';

const bcrypt = require('bcrypt');

/**
 * Seed data awal: memasukkan pegawai contoh dan akun admin default.
 * Fungsi ini idempoten — aman dijalankan berulang kali.
 * Data hanya dimasukkan jika tabel masih kosong.
 *
 * @param {import('better-sqlite3').Database} db - Instance better-sqlite3
 */
function runSeed(db) {
  // --- Seed tabel employees ---
  const employeeCount = db.prepare('SELECT COUNT(*) AS cnt FROM employees').get().cnt;

  if (employeeCount === 0) {
    const insertEmployee = db.prepare(
      'INSERT INTO employees (name, department, whatsapp_no) VALUES (?, ?, ?)'
    );

    const employees = [
      { name: 'Budi Santoso',      department: 'Bagian Umum',              whatsapp_no: '6281234567890' },
      { name: 'Siti Rahayu',       department: 'Bagian Keuangan',          whatsapp_no: '6282345678901' },
      { name: 'Ahmad Fauzi',       department: 'Bagian Kepegawaian',       whatsapp_no: '6283456789012' },
      { name: 'Dewi Lestari',      department: 'Bagian Perencanaan',       whatsapp_no: '6284567890123' },
      { name: 'Rudi Hermawan',     department: 'Bagian Teknologi Informasi', whatsapp_no: '6285678901234' },
      { name: 'Rina Wulandari',    department: 'Bagian Hukum',             whatsapp_no: null },
    ];

    const seedEmployees = db.transaction(() => {
      for (const emp of employees) {
        insertEmployee.run(emp.name, emp.department, emp.whatsapp_no);
      }
    });

    seedEmployees();
    console.info(`[seed] Berhasil memasukkan ${employees.length} data pegawai.`);
  } else {
    console.info('[seed] Tabel employees sudah berisi data, lewati seed pegawai.');
  }

  // --- Seed tabel users ---
  const userCount = db.prepare('SELECT COUNT(*) AS cnt FROM users').get().cnt;

  if (userCount === 0) {
    const passwordHash = bcrypt.hashSync('admin123', 12);

    db.prepare(
      'INSERT INTO users (username, password, name) VALUES (?, ?, ?)'
    ).run('admin', passwordHash, 'Administrator');

    console.info('[seed] Berhasil memasukkan akun admin default.');
  } else {
    console.info('[seed] Tabel users sudah berisi data, lewati seed admin.');
  }
}

module.exports = runSeed;
module.exports.default = runSeed;
