# Dokumen Persyaratan

## Pendahuluan

Aplikasi Buku Tamu Digital adalah sistem berbasis web untuk kantor pemerintah yang menggantikan buku tamu fisik. Pengunjung mengisi data kunjungan secara mandiri melalui form digital. Petugas dapat masuk ke dashboard menggunakan akun yang terautentikasi untuk memantau daftar tamu hari ini dan memperbarui status kunjungan. Saat tamu baru terdaftar, sistem mengirimkan notifikasi otomatis melalui WhatsApp ke nomor pegawai yang menjadi tujuan kunjungan.

## Glosarium

- **Sistem**: Aplikasi Buku Tamu Digital secara keseluruhan
- **Pengunjung**: Orang yang datang ke kantor dan mengisi form buku tamu
- **Petugas**: Staf kantor yang memiliki akun dan dapat masuk ke dashboard untuk memantau serta mengelola data tamu
- **Pegawai**: Staf kantor yang menjadi tujuan kunjungan dan menerima notifikasi WhatsApp saat ada tamu yang ditujukan kepadanya
- **Form_Tamu**: Antarmuka pengisian data kunjungan yang digunakan oleh Pengunjung
- **Dashboard**: Antarmuka pemantauan data tamu yang hanya dapat diakses oleh Petugas yang telah terautentikasi
- **Data_Kunjungan**: Rekaman informasi satu kunjungan, mencakup nama, instansi/asal, keperluan, tujuan, waktu masuk, dan status
- **Validator**: Komponen sistem yang memeriksa keabsahan data masukan
- **WhatsApp_Gateway**: Layanan pihak ketiga yang digunakan oleh Sistem untuk mengirimkan pesan WhatsApp ke nomor Pegawai

---

## Persyaratan

### Persyaratan 1: Pengisian Form Tamu

**User Story:** Sebagai Pengunjung, saya ingin mengisi form buku tamu secara digital, sehingga proses registrasi kunjungan menjadi cepat dan data tercatat dengan akurat.

#### Kriteria Penerimaan

1. THE Form_Tamu SHALL menampilkan kolom isian: nama lengkap, instansi/asal, keperluan kunjungan, dan tujuan kunjungan (unit/bagian yang dituju).
2. WHEN Pengunjung mengirimkan form, THE Validator SHALL memeriksa bahwa kolom nama lengkap, instansi/asal, keperluan kunjungan, dan tujuan kunjungan tidak kosong.
3. IF kolom wajib tidak diisi, THEN THE Form_Tamu SHALL menampilkan pesan kesalahan yang menyebutkan nama kolom yang belum diisi.
4. WHEN Pengunjung mengirimkan form dengan data lengkap dan valid, THE Sistem SHALL menyimpan Data_Kunjungan beserta waktu masuk secara otomatis berdasarkan waktu server.
5. WHEN Data_Kunjungan berhasil disimpan, THE Form_Tamu SHALL menampilkan pesan konfirmasi keberhasilan kepada Pengunjung.
6. WHEN Data_Kunjungan berhasil disimpan, THE Sistem SHALL mengatur status kunjungan menjadi "Hadir".

---

### Persyaratan 2: Autentikasi Petugas

**User Story:** Sebagai Petugas, saya ingin masuk ke dashboard menggunakan nama pengguna dan kata sandi, sehingga hanya staf yang berwenang yang dapat mengakses dan mengelola data kunjungan.

#### Kriteria Penerimaan

1. THE Dashboard SHALL hanya dapat diakses oleh Petugas yang telah berhasil melakukan autentikasi.
2. THE Sistem SHALL menyediakan halaman login dengan kolom nama pengguna dan kata sandi.
3. WHEN Petugas mengirimkan kredensial yang valid, THE Sistem SHALL membuat sesi autentikasi dan mengarahkan Petugas ke Dashboard.
4. IF Petugas mengirimkan kredensial yang tidak valid, THEN THE Sistem SHALL menampilkan pesan kesalahan dan tidak memberikan akses ke Dashboard.
5. WHEN Petugas yang belum terautentikasi mencoba mengakses URL Dashboard, THE Sistem SHALL mengarahkan Petugas ke halaman login.
6. WHEN Petugas memilih keluar (logout), THE Sistem SHALL mengakhiri sesi autentikasi dan mengarahkan Petugas ke halaman login.
7. THE Sistem SHALL menyimpan kata sandi Petugas dalam bentuk hash menggunakan algoritma yang aman dan tidak menyimpan kata sandi dalam bentuk teks biasa.

---

### Persyaratan 3: Dashboard Petugas

**User Story:** Sebagai Petugas, saya ingin melihat daftar tamu yang berkunjung hari ini melalui dashboard, sehingga saya dapat memantau aktivitas kunjungan secara real-time.

#### Kriteria Penerimaan

1. THE Dashboard SHALL menampilkan daftar Data_Kunjungan untuk tanggal hari ini secara default saat halaman dibuka.
2. THE Dashboard SHALL menampilkan kolom berikut untuk setiap entri: nomor urut, nama lengkap, instansi/asal, keperluan, tujuan kunjungan, waktu masuk, dan status.
3. WHEN data kunjungan baru masuk, THE Dashboard SHALL memperbarui daftar tamu tanpa memerlukan reload halaman penuh oleh Petugas.
4. THE Dashboard SHALL menampilkan jumlah total Pengunjung pada hari ini di bagian atas halaman.
5. WHEN Petugas memilih tanggal tertentu, THE Dashboard SHALL menampilkan daftar Data_Kunjungan untuk tanggal yang dipilih.
6. WHEN Petugas memasukkan kata kunci pencarian, THE Dashboard SHALL memfilter daftar tamu berdasarkan nama lengkap atau tujuan kunjungan yang mengandung kata kunci tersebut.

---

### Persyaratan 4: Penyimpanan Data

**User Story:** Sebagai Petugas, saya ingin data kunjungan tersimpan secara persisten dan aman, sehingga data dapat diakses kembali kapan pun dibutuhkan.

#### Kriteria Penerimaan

1. THE Sistem SHALL menyimpan setiap Data_Kunjungan secara persisten ke dalam basis data.
2. THE Sistem SHALL mempertahankan seluruh Data_Kunjungan yang telah tersimpan meskipun aplikasi di-restart.
3. IF terjadi kegagalan penyimpanan data, THEN THE Sistem SHALL menampilkan pesan kesalahan kepada Pengunjung dan mencatat detail kegagalan di log sistem.
4. THE Sistem SHALL menyimpan setiap Data_Kunjungan dengan atribut: id unik, nama lengkap, instansi/asal, keperluan, tujuan kunjungan, waktu masuk, dan status.

---

### Persyaratan 5: Notifikasi WhatsApp ke Pegawai

**User Story:** Sebagai Pegawai, saya ingin menerima notifikasi WhatsApp saat ada tamu yang datang untuk menemui saya, sehingga saya dapat segera mengetahui dan menyambut tamu tersebut.

#### Kriteria Penerimaan

1. WHEN Data_Kunjungan berhasil disimpan, THE Sistem SHALL mengirimkan pesan notifikasi melalui WhatsApp_Gateway ke nomor WhatsApp Pegawai yang menjadi tujuan kunjungan.
2. THE Sistem SHALL menyertakan informasi berikut dalam pesan notifikasi: nama lengkap Pengunjung, instansi/asal, keperluan kunjungan, dan waktu masuk.
3. IF pengiriman notifikasi WhatsApp gagal, THEN THE Sistem SHALL mencatat detail kegagalan di log sistem dan tetap menyimpan Data_Kunjungan tanpa membatalkan proses registrasi tamu.
4. THE Sistem SHALL menyimpan nomor WhatsApp untuk setiap Pegawai yang terdaftar sebagai tujuan kunjungan.
5. IF tujuan kunjungan yang dipilih Pengunjung tidak memiliki nomor WhatsApp yang terdaftar, THEN THE Sistem SHALL melewati pengiriman notifikasi dan mencatat kejadian tersebut di log sistem.

---

### Persyaratan 6: Manajemen Status Kunjungan

**User Story:** Sebagai Petugas, saya ingin memperbarui status kunjungan tamu, sehingga saya dapat mencatat tamu yang telah selesai berkunjung.

#### Kriteria Penerimaan

1. THE Dashboard SHALL menampilkan tombol aksi untuk mengubah status setiap entri Data_Kunjungan.
2. WHEN Petugas mengubah status kunjungan menjadi "Selesai", THE Sistem SHALL memperbarui status Data_Kunjungan yang bersangkutan dan mencatat waktu keluar secara otomatis.
3. WHEN status Data_Kunjungan diperbarui, THE Dashboard SHALL memperbarui tampilan status pada baris yang bersangkutan tanpa reload halaman penuh.
4. THE Sistem SHALL mendukung dua nilai status kunjungan: "Hadir" dan "Selesai".
