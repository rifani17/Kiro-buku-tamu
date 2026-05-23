# Rencana Implementasi: Buku Tamu Digital

## Ikhtisar

Implementasi dilakukan secara bertahap mengikuti pola MVC dengan Node.js + Express. Setiap tahap membangun di atas tahap sebelumnya, dimulai dari fondasi proyek, lapisan data, logika bisnis, antarmuka pengguna, hingga pengujian menyeluruh. Semua komponen diwiring bersama di tahap akhir.

## Tugas

- [x] 1. Setup proyek dan struktur folder
  - Inisialisasi `package.json` dengan `npm init`
  - Pasang dependensi produksi: `express`, `ejs`, `express-session`, `bcrypt`, `better-sqlite3`, `node-fetch` (atau `axios`)
  - Pasang dependensi pengembangan: `jest`, `fast-check`, `supertest`, `nodemon`
  - Buat struktur direktori: `src/controllers/`, `src/models/`, `src/services/`, `src/middleware/`, `src/routes/`, `src/views/`, `tests/unit/`, `tests/integration/`
  - Buat file `src/app.js` sebagai entry point Express (konfigurasi middleware: `express.urlencoded`, `express.json`, `express-session`, EJS sebagai view engine)
  - Buat file `src/config.js` untuk konstanta konfigurasi (port, session secret, path DB, URL WA Gateway)
  - Tambahkan script `start`, `dev`, dan `test` di `package.json`
  - _Persyaratan: 4.1, 4.2_

- [x] 2. Implementasi database dan migrasi
  - [x] 2.1 Buat modul koneksi database (`src/database.js`)
    - Inisialisasi koneksi `better-sqlite3` ke file SQLite
    - Ekspor instance database yang dapat digunakan oleh model
    - _Persyaratan: 4.1, 4.2_

  - [x] 2.2 Buat skrip migrasi (`src/migrations/001_initial_schema.js`)
    - Buat tabel `users` sesuai skema (id, username UNIQUE, password hash, name, created_at)
    - Buat tabel `employees` sesuai skema (id, name, department, whatsapp_no nullable, created_at)
    - Buat tabel `visits` sesuai skema (id, visitor_name, institution, purpose, employee_id FK, check_in_at, check_out_at nullable, status CHECK, created_at)
    - Gunakan `CREATE TABLE IF NOT EXISTS` agar idempoten
    - _Persyaratan: 4.1, 4.4_

  - [x] 2.3 Buat skrip seed data awal (`src/migrations/seed.js`)
    - Masukkan minimal 5 data pegawai contoh dengan nama, departemen, dan nomor WhatsApp
    - Masukkan 1 akun admin default (username: `admin`, password di-hash dengan bcrypt cost factor 12)
    - Jalankan migrasi dan seed saat aplikasi pertama kali dijalankan jika tabel belum ada
    - _Persyaratan: 2.7, 5.4_

- [ ] 3. Implementasi lapisan model
  - [ ] 3.1 Buat `Visit` model (`src/models/visitModel.js`)
    - Fungsi `insertVisit(data)`: INSERT kunjungan baru, kembalikan ID yang dihasilkan
    - Fungsi `getVisitById(id)`: SELECT kunjungan berdasarkan ID dengan JOIN ke tabel employees
    - Fungsi `getVisitsByDate(date)`: SELECT semua kunjungan untuk tanggal tertentu (format YYYY-MM-DD)
    - Fungsi `searchVisits(keyword, date)`: SELECT kunjungan dengan filter keyword pada visitor_name atau employee name
    - Fungsi `updateVisitStatus(id, status)`: UPDATE status dan isi check_out_at saat status = 'Selesai'
    - _Persyaratan: 1.4, 1.6, 3.1, 3.5, 3.6, 4.1, 4.4, 6.2_

  - [ ]* 3.2 Tulis property test untuk Visit model — PBT 2
    - **Properti 2: Penyimpanan data kunjungan mempertahankan semua atribut (round-trip)**
    - **Memvalidasi: Persyaratan 1.4, 1.6, 4.1, 4.4**
    - Gunakan fast-check untuk menghasilkan objek kunjungan valid dengan string acak
    - Verifikasi: `insertVisit(data)` → `getVisitById(id)` menghasilkan objek identik untuk semua atribut
    - File: `tests/unit/visitModel.test.js`

  - [ ]* 3.3 Tulis property test untuk transisi status — PBT 3
    - **Properti 3: Transisi status kunjungan bersifat satu arah dan mencatat waktu keluar**
    - **Memvalidasi: Persyaratan 6.2, 6.4**
    - Verifikasi: setelah `updateVisitStatus(id, 'Selesai')`, status = 'Selesai' dan check_out_at tidak null
    - Verifikasi: percobaan mengubah status 'Selesai' kembali ke 'Hadir' ditolak
    - File: `tests/unit/statusTransition.test.js`

  - [ ] 3.4 Buat `Employee` model (`src/models/employeeModel.js`)
    - Fungsi `getAllEmployees()`: SELECT semua pegawai (untuk dropdown form tamu)
    - Fungsi `getEmployeeById(id)`: SELECT pegawai berdasarkan ID (untuk notifikasi WA)
    - _Persyaratan: 1.1, 5.1, 5.4_

  - [ ] 3.5 Buat `User` model (`src/models/userModel.js`)
    - Fungsi `getUserByUsername(username)`: SELECT user berdasarkan username (untuk autentikasi)
    - Fungsi `hashPassword(plaintext)`: Bungkus `bcrypt.hash` dengan cost factor 12
    - _Persyaratan: 2.3, 2.7_

  - [ ]* 3.6 Tulis property test untuk password hashing — PBT 7
    - **Properti 7: Password selalu disimpan dalam bentuk bcrypt hash**
    - **Memvalidasi: Persyaratan 2.7**
    - Generator: string password acak dengan berbagai panjang dan karakter
    - Verifikasi: hash berbeda dari plaintext, `bcrypt.compare(plain, hash) === true`, `bcrypt.getRounds(hash) >= 10`
    - File: `tests/unit/auth.test.js`

- [ ] 4. Implementasi validasi form dan filter data
  - [ ] 4.1 Buat modul validasi form tamu (`src/utils/validation.js`)
    - Fungsi `validateVisitForm(input)`: periksa visitor_name, institution, purpose, employee_id tidak kosong/whitespace
    - Kembalikan `{ valid: boolean, errors: { field: string|null } }`
    - _Persyaratan: 1.2, 1.3_

  - [ ]* 4.2 Tulis property test untuk validasi form — PBT 1
    - **Properti 1: Validasi field wajib menolak input kosong/whitespace**
    - **Memvalidasi: Persyaratan 1.2, 1.3**
    - Generator: kombinasi input di mana minimal satu field wajib berisi string whitespace atau kosong
    - Verifikasi: `validateVisitForm(input)` mengembalikan `{ valid: false }` dengan field bermasalah teridentifikasi
    - File: `tests/unit/validation.test.js`

  - [ ] 4.3 Buat modul filter pencarian dan tanggal (`src/utils/filters.js`)
    - Fungsi `filterByKeyword(visits, keyword)`: filter array kunjungan berdasarkan visitor_name atau employee_name
    - Fungsi `filterByDate(visits, date)`: filter array kunjungan berdasarkan tanggal check_in_at
    - _Persyaratan: 3.5, 3.6_

  - [ ]* 4.4 Tulis property test untuk filter pencarian — PBT 5
    - **Properti 5: Filter pencarian bersifat inklusif dan tidak menghasilkan false negative**
    - **Memvalidasi: Persyaratan 3.6**
    - Generator: daftar kunjungan acak dan kata kunci pencarian
    - Verifikasi: semua hasil mengandung kata kunci; tidak ada entri yang mengandung kata kunci tapi tidak muncul di hasil
    - File: `tests/unit/search.test.js`

  - [ ]* 4.5 Tulis property test untuk filter tanggal — PBT 6
    - **Properti 6: Filter tanggal hanya mengembalikan data untuk tanggal yang dipilih**
    - **Memvalidasi: Persyaratan 3.5**
    - Generator: kunjungan dengan berbagai tanggal acak, pilih satu tanggal sebagai filter
    - Verifikasi: semua hasil memiliki check_in_at pada tanggal yang dipilih; tidak ada entri dari tanggal lain
    - File: `tests/unit/dateFilter.test.js`

- [ ] 5. Checkpoint — Pastikan semua test lapisan model dan utilitas lulus
  - Jalankan `npm test` dan pastikan semua unit test dan PBT yang sudah ditulis lulus
  - Tanyakan kepada pengguna jika ada pertanyaan sebelum melanjutkan

- [ ] 6. Implementasi middleware dan layanan
  - [ ] 6.1 Buat middleware autentikasi (`src/middleware/auth.js`)
    - Fungsi `requireAuth(req, res, next)`: periksa `req.session.userId`, redirect ke `/auth/login` jika tidak ada
    - _Persyaratan: 2.1, 2.5_

  - [ ] 6.2 Buat SSE Manager (`src/services/sseManager.js`)
    - Fungsi `addClient(res)`: daftarkan koneksi SSE baru ke daftar klien aktif
    - Fungsi `removeClient(res)`: hapus koneksi SSE yang terputus
    - Fungsi `broadcast(eventData)`: kirim event ke semua klien terdaftar dengan format SSE (`data: ...\n\n`)
    - Tangani event `new-visit` dan `status-update`
    - _Persyaratan: 3.3, 6.3_

  - [ ] 6.3 Buat Notification Service (`src/services/notificationService.js`)
    - Fungsi `formatNotificationMessage(visit)`: format string pesan WA dengan visitor_name, institution, purpose, check_in_at
    - Fungsi `sendVisitNotification(visit, employee)`: kirim HTTP POST ke WA Gateway, catat hasil ke log
    - Pastikan fungsi TIDAK melempar exception — tangani semua error secara graceful dengan `console.warn`
    - _Persyaratan: 5.1, 5.2, 5.3, 5.5_

  - [ ]* 6.4 Tulis property test untuk format pesan notifikasi — PBT 8
    - **Properti 8: Format pesan notifikasi mengandung semua informasi kunjungan**
    - **Memvalidasi: Persyaratan 5.2**
    - Generator: data kunjungan acak (nama, instansi, keperluan, waktu masuk bervariasi)
    - Verifikasi: `formatNotificationMessage(visit)` menghasilkan string yang mengandung visitor_name, institution, purpose, check_in_at
    - File: `tests/unit/notification.test.js`

  - [ ]* 6.5 Tulis property test untuk fault-tolerance notifikasi — PBT 4
    - **Properti 4: Kegagalan notifikasi WA tidak membatalkan penyimpanan data**
    - **Memvalidasi: Persyaratan 5.3, 5.5**
    - Generator: data kunjungan valid; mock WA gateway untuk selalu gagal (throw error)
    - Verifikasi: data kunjungan tetap tersimpan di database meskipun `sendVisitNotification` melempar error
    - File: `tests/unit/notification.test.js`

- [ ] 7. Implementasi controller dan routing
  - [ ] 7.1 Buat Auth Controller (`src/controllers/authController.js`)
    - Fungsi `showLogin(req, res)`: render `views/auth/login.ejs`
    - Fungsi `processLogin(req, res)`: ambil user dari DB, `bcrypt.compare`, buat `req.session.userId`, redirect ke `/dashboard`
    - Fungsi `logout(req, res)`: hancurkan sesi, redirect ke `/auth/login`
    - _Persyaratan: 2.2, 2.3, 2.4, 2.6_

  - [ ] 7.2 Buat Visitor Controller (`src/controllers/visitorController.js`)
    - Fungsi `showForm(req, res)`: ambil semua pegawai dari DB, render `views/visitor/form.ejs`
    - Fungsi `submitForm(req, res)`: validasi input, simpan ke DB, kirim notifikasi WA (async), broadcast SSE, redirect ke konfirmasi
    - Fungsi `showConfirm(req, res)`: render `views/visitor/confirm.ejs`
    - Tangani kegagalan DB dengan render error dan `console.error`
    - _Persyaratan: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 4.3, 5.1_

  - [ ] 7.3 Buat Dashboard Controller (`src/controllers/dashboardController.js`)
    - Fungsi `index(req, res)`: ambil kunjungan hari ini dari DB, render `views/dashboard/index.ejs`
    - Fungsi `getVisits(req, res)`: ambil kunjungan dengan filter tanggal dan/atau keyword, kembalikan JSON
    - Fungsi `updateStatus(req, res)`: update status kunjungan ke 'Selesai', broadcast SSE `status-update`, kembalikan JSON
    - _Persyaratan: 3.1, 3.2, 3.4, 3.5, 3.6, 6.1, 6.2, 6.3_

  - [ ] 7.4 Buat file routing (`src/routes/index.js`)
    - Daftarkan semua route sesuai tabel routing di design.md
    - Terapkan middleware `requireAuth` pada route `/dashboard/*` dan `/auth/logout`
    - Daftarkan route SSE: `GET /dashboard/events` → `sseManager.addClient`
    - _Persyaratan: 2.1, 2.5_

  - [ ] 7.5 Hubungkan router ke `src/app.js`
    - Import dan gunakan router di app.js
    - Tambahkan error handler global (500) dan handler 404
    - _Persyaratan: 4.3_

- [ ] 8. Implementasi tampilan (Views)
  - [ ] 8.1 Buat partial views (`src/views/partials/`)
    - Buat `header.ejs`: tag HTML head, link CSS (Bootstrap CDN atau stylesheet lokal), meta charset/viewport
    - Buat `footer.ejs`: penutup tag HTML

  - [ ] 8.2 Buat halaman form tamu (`src/views/visitor/form.ejs`)
    - Form dengan field: nama lengkap, instansi/asal, keperluan, dropdown tujuan kunjungan (dari data pegawai)
    - Tampilkan pesan error per field jika validasi gagal (gunakan data `errors` dari controller)
    - Pertahankan nilai yang sudah diisi saat form dikembalikan karena error
    - _Persyaratan: 1.1, 1.3_

  - [ ] 8.3 Buat halaman konfirmasi (`src/views/visitor/confirm.ejs`)
    - Tampilkan pesan sukses kepada pengunjung
    - Tampilkan ringkasan data kunjungan yang baru didaftarkan
    - _Persyaratan: 1.5_

  - [ ] 8.4 Buat halaman login (`src/views/auth/login.ejs`)
    - Form dengan field username dan password
    - Tampilkan pesan error jika kredensial salah
    - _Persyaratan: 2.2, 2.4_

  - [ ] 8.5 Buat halaman dashboard (`src/views/dashboard/index.ejs`)
    - Tampilkan jumlah total pengunjung hari ini di bagian atas
    - Tabel daftar kunjungan dengan kolom: no, nama, instansi, keperluan, tujuan, waktu masuk, status, aksi
    - Input filter tanggal dan input pencarian keyword
    - Tombol "Selesai" pada setiap baris untuk mengubah status kunjungan
    - Tombol logout
    - Script JavaScript inline untuk: koneksi SSE (`EventSource`), update tabel saat event `new-visit` diterima, update baris saat event `status-update` diterima, AJAX untuk filter dan update status tanpa reload halaman
    - _Persyaratan: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 6.1, 6.3_

- [ ] 9. Checkpoint — Pastikan semua test lulus dan aplikasi dapat dijalankan
  - Jalankan `npm test` dan pastikan semua test lulus
  - Verifikasi aplikasi dapat dijalankan dengan `npm run dev` tanpa error
  - Tanyakan kepada pengguna jika ada pertanyaan sebelum melanjutkan

- [ ] 10. Implementasi integration test
  - [ ] 10.1 Tulis integration test alur registrasi tamu (`tests/integration/visitorFlow.test.js`)
    - Test: POST `/visits` dengan data valid → status 302 redirect ke `/visits/confirm`
    - Test: POST `/visits` dengan field kosong → status 200 dengan pesan error
    - Test: POST `/visits` valid → data tersimpan di DB dengan status 'Hadir'
    - Test: POST `/visits` valid → SSE broadcast dipanggil
    - _Persyaratan: 1.2, 1.3, 1.4, 1.5, 1.6_

  - [ ] 10.2 Tulis integration test alur autentikasi (`tests/integration/authFlow.test.js`)
    - Test: POST `/auth/login` dengan kredensial valid → redirect ke `/dashboard`
    - Test: POST `/auth/login` dengan kredensial salah → render halaman login dengan pesan error
    - Test: GET `/dashboard` tanpa sesi → redirect ke `/auth/login`
    - Test: POST `/auth/logout` dengan sesi aktif → sesi dihapus, redirect ke `/auth/login`
    - _Persyaratan: 2.1, 2.3, 2.4, 2.5, 2.6_

  - [ ] 10.3 Tulis integration test alur dashboard (`tests/integration/dashboardFlow.test.js`)
    - Test: GET `/dashboard` dengan sesi valid → render halaman dashboard dengan data hari ini
    - Test: GET `/dashboard/visits?date=YYYY-MM-DD` → kembalikan JSON kunjungan untuk tanggal tersebut
    - Test: GET `/dashboard/visits?keyword=xxx` → kembalikan JSON kunjungan yang cocok
    - Test: PATCH `/dashboard/visits/:id/status` dengan sesi valid → status diperbarui, SSE broadcast dipanggil
    - Test: PATCH `/dashboard/visits/:id/status` tanpa sesi → redirect ke `/auth/login`
    - _Persyaratan: 3.1, 3.2, 3.5, 3.6, 6.1, 6.2, 6.3_

- [ ] 11. Checkpoint akhir — Pastikan semua test lulus
  - Jalankan `npm test` dan pastikan seluruh test suite (unit, PBT, integration) lulus
  - Tanyakan kepada pengguna jika ada pertanyaan atau penyesuaian yang diperlukan

## Catatan

- Tugas yang ditandai dengan `*` bersifat opsional dan dapat dilewati untuk MVP yang lebih cepat
- Setiap tugas merujuk pada persyaratan spesifik untuk keterlacakan
- Checkpoint memastikan validasi bertahap di setiap fase
- Property test memvalidasi properti kebenaran universal (8 properti dari design.md)
- Unit test memvalidasi skenario spesifik dan kasus tepi
- Semua PBT dikonfigurasi dengan minimum 100 iterasi sesuai design.md
