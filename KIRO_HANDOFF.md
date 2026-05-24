# Kiro Handoff - Buku Tamu Digital

Dokumen ini merangkum status proyek berdasarkan pemeriksaan dan perbaikan terakhir, supaya Kiro bisa melanjutkan dari kondisi aktual tanpa mengulang analisis dari nol.

## Ringkasan Status

- MVP inti sudah berjalan: form tamu, login, dashboard, notifikasi WA, SSE, dan penyimpanan data sudah terhubung.
- `jest` saat ini lulus: 5 test suite, 56 test passed.
- Ada masalah penting yang sudah ditangani: aplikasi gagal boot ketika memakai database SQLite di `G:\Buku-Tamu\data\buku_tamu.db`.
- Untuk menjaga MVP tetap jalan, database sekarang otomatis fallback ke lokasi writable di environment ini: `C:\Users\zoan\.codex\memories\buku_tamu.db`.

## Perubahan Terakhir yang Penting

### 1. Startup database dibuat tahan gagal

File: [src/database.js](G:/Buku-Tamu/src/database.js)

Yang dilakukan:

- Menambahkan pengecekan directory sebelum membuka SQLite.
- Menambahkan probe write sederhana untuk memastikan database benar-benar bisa dipakai, bukan hanya dibuka.
- Jika database di path utama gagal dipakai, aplikasi otomatis pindah ke fallback path.
- WAL mode tetap dicoba, tetapi jika gagal tidak menghentikan startup.

Kenapa ini penting:

- Sebelumnya `node src/app.js` gagal berhenti di startup karena `SQLITE_CANTOPEN`.
- Setelah fallback ini, aplikasi bisa boot dan migrasi/seed selesai dijalankan.

### 2. Boot aplikasi sudah diverifikasi

Hasil terakhir:

- Aplikasi berhasil start dan menampilkan:
  - `Server berjalan di http://localhost:3000`
- Seed berhasil dijalankan.
- Test suite tetap hijau.

### 3. Akses runtime yang relevan

Kalau ingin mengecek aplikasi secara langsung di browser, gunakan:

- `http://localhost:3000`
- `http://127.0.0.1:3000`
- `http://localhost:3000/auth/login`
- `http://localhost:3000/dashboard`

Akun admin default:

- username: `admin`
- password: `admin123`

Catatan:

- Dashboard membutuhkan login dulu.
- Server sudah pernah diverifikasi merespons `HTTP 200` pada endpoint root setelah dijalankan dari environment ini.

## Kondisi Implementasi Saat Ini

### Sudah ada dan berfungsi

- Routing dasar aplikasi.
- Login/logout petugas.
- Form tamu dan halaman konfirmasi.
- Dashboard dengan data hari ini.
- SSE untuk update real-time.
- Notifikasi WhatsApp via HTTP client.
- Validasi form tamu.
- Filter pencarian dan tanggal.
- Unit test untuk utilitas dan notifikasi.
- Satu integration test untuk alur registrasi tamu.
- Integration test untuk alur autentikasi.
- Integration test untuk alur dashboard.

### Masih belum lengkap atau sengaja belum dikejar

- Property-based tests yang masih ditandai opsional di `tasks.md`.
- Checklist di `.kiro/specs/digital-guest-book/tasks.md` belum sinkron dengan kode aktual.

## Catatan Teknis Penting

### Database path

- Path di config masih menunjuk ke: `G:\Buku-Tamu\data\buku_tamu.db`
- Karena drive/izin di environment ini tidak stabil untuk SQLite write, aplikasi sekarang fallback ke:
  - `C:\Users\zoan\.codex\memories\buku_tamu.db`

Implikasi:

- Kalau Kiro melanjutkan pekerjaan yang memerlukan data persist lokal, gunakan fallback path ini sebagai sumber data runtime saat ini.
- Jika ingin mengembalikan DB ke folder project, perlu memastikan storage target benar-benar writable untuk operasi SQLite write-lock/journal.

### Seed data

- Seed sudah memasukkan:
  - 6 pegawai contoh
  - 1 akun admin default
- Akun default yang dipakai di seed:
  - username: `admin`
  - password: `admin123`

### Test status

- `npm test` tidak bisa dijalankan langsung lewat `npm` PowerShell karena policy execution di shell ini.
- Tapi `.\node_modules\.bin\jest.cmd --runInBand` berhasil dan lulus.

## Urutan Lanjut yang Disarankan

1. Sinkronkan `tasks.md` dengan kondisi kode aktual.
   - Tandai item yang sudah benar-benar selesai.
   - Jangan biarkan checklist menunjukkan pekerjaan belum selesai kalau implementasinya sudah ada.

2. Audit kecil untuk MVP.
   - Pastikan login, dashboard, dan update status tidak bergantung pada asumsi path database lama.
   - Pastikan tidak ada side effect yang masih mengarah ke file DB di `G:` secara hard-coded.

3. Kalau ingin rapikan MVP lebih jauh:
   - Tambahkan logging yang lebih jelas untuk fallback database.
   - Pastikan user-facing error saat database utama tidak tersedia tetap aman dan informatif.

## File yang Paling Relevan Untuk Lanjutan

- [src/app.js](G:/Buku-Tamu/src/app.js)
- [src/database.js](G:/Buku-Tamu/src/database.js)
- [src/controllers/visitorController.js](G:/Buku-Tamu/src/controllers/visitorController.js)
- [src/controllers/dashboardController.js](G:/Buku-Tamu/src/controllers/dashboardController.js)
- [src/controllers/authController.js](G:/Buku-Tamu/src/controllers/authController.js)
- [src/routes/index.js](G:/Buku-Tamu/src/routes/index.js)
- [src/services/notificationService.js](G:/Buku-Tamu/src/services/notificationService.js)
- [src/services/sseManager.js](G:/Buku-Tamu/src/services/sseManager.js)
- [tests/integration/visitorFlow.test.js](G:/Buku-Tamu/tests/integration/visitorFlow.test.js)
- [tests/integration/authFlow.test.js](G:/Buku-Tamu/tests/integration/authFlow.test.js)
- [tests/integration/dashboardFlow.test.js](G:/Buku-Tamu/tests/integration/dashboardFlow.test.js)
- [.kiro/specs/digital-guest-book/tasks.md](G:/Buku-Tamu/.kiro/specs/digital-guest-book/tasks.md)

## Kesimpulan

MVP inti sudah hidup, tetapi masih ada pekerjaan lanjutan di area verifikasi opsional dan sinkronisasi task list. Jika Kiro melanjutkan dari sini, prioritas paling aman adalah menjaga boot path tetap stabil, lalu merapikan status task list agar tidak menyesatkan, lalu mengerjakan item opsional bila memang dibutuhkan.
