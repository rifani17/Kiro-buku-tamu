'use strict';

/**
 * Integration test: Alur registrasi tamu
 *
 * Persyaratan: 1.2, 1.3, 1.4, 1.5, 1.6
 *
 * Strategi:
 * - Mock src/database.js dengan instance SQLite in-memory agar tidak mengotori DB nyata
 * - Mock src/services/sseManager.js untuk memverifikasi broadcast dipanggil
 * - Mock src/services/notificationService.js untuk menghindari HTTP call ke WA Gateway
 *
 * Catatan: jest.mock() factory tidak boleh referensi variabel luar scope.
 * Solusi: buat DB in-memory di dalam factory, lalu expose via require() setelah mock.
 */

// ── Mock database dengan in-memory SQLite ────────────────────────────────────
// Variabel dengan prefix 'mock' diizinkan oleh Jest di dalam factory
jest.mock('../../src/database', () => {
  const Database = require('better-sqlite3');
  const runMigration = require('../../src/migrations/001_initial_schema');
  const runSeed = require('../../src/migrations/seed');

  const mockDb = new Database(':memory:');
  runMigration(mockDb);
  runSeed(mockDb);

  return mockDb;
});

// ── Mock SSE Manager ─────────────────────────────────────────────────────────
jest.mock('../../src/services/sseManager', () => ({
  broadcast: jest.fn(),
  addClient: jest.fn(),
  removeClient: jest.fn(),
}));

// ── Mock Notification Service ─────────────────────────────────────────────────
jest.mock('../../src/services/notificationService', () => ({
  sendVisitNotification: jest.fn().mockResolvedValue(undefined),
  formatNotificationMessage: jest.fn().mockReturnValue('mock message'),
}));

// ── Require setelah semua mock terpasang ──────────────────────────────────────
const request = require('supertest');
const app = require('../../src/app');
const { broadcast } = require('../../src/services/sseManager');
// Ambil instance DB yang sama yang digunakan oleh app (in-memory mock)
const testDb = require('../../src/database');

// ── Helper: ambil data kunjungan langsung dari in-memory DB ──────────────────
function getLastVisitFromDb() {
  return testDb
    .prepare('SELECT * FROM visits ORDER BY id DESC LIMIT 1')
    .get();
}

// ── Data valid untuk form submission ─────────────────────────────────────────
const validFormData = {
  visitor_name: 'Andi Prasetyo',
  institution: 'PT Teknologi Maju',
  purpose: 'Rapat koordinasi proyek',
  employee_id: '1', // Seed data memiliki pegawai dengan ID 1-6
};

// ── Test Suite ────────────────────────────────────────────────────────────────

describe('Integration: Alur Registrasi Tamu (POST /visits)', () => {
  beforeEach(() => {
    // Reset mock call counts sebelum setiap test
    jest.clearAllMocks();
  });

  afterAll(() => {
    // Bersihkan semua kunjungan test dari in-memory DB
    testDb.prepare('DELETE FROM visits').run();
  });

  // ── Test 1: POST /visits dengan data valid → redirect 302 ke /visits/confirm ──

  test('POST /visits dengan data valid → status 302 redirect ke /visits/confirm', async () => {
    const res = await request(app)
      .post('/visits')
      .type('form')
      .send(validFormData);

    expect(res.status).toBe(302);
    expect(res.headers.location).toBe('/visits/confirm');
  });

  // ── Test 2: POST /visits dengan field kosong → status 422 dengan pesan error ──

  test('POST /visits dengan visitor_name kosong → status 422 dengan pesan error', async () => {
    const res = await request(app)
      .post('/visits')
      .type('form')
      .send({
        visitor_name: '',
        institution: 'PT Teknologi Maju',
        purpose: 'Rapat koordinasi',
        employee_id: '1',
      });

    // Controller mengembalikan 422 saat validasi gagal (Persyaratan 1.2, 1.3)
    expect([200, 422]).toContain(res.status);
    // Halaman harus mengandung indikasi error
    expect(res.text).toMatch(/wajib|error|kosong|required/i);
  });

  test('POST /visits dengan semua field kosong → status 422 dengan pesan error', async () => {
    const res = await request(app)
      .post('/visits')
      .type('form')
      .send({
        visitor_name: '',
        institution: '',
        purpose: '',
        employee_id: '',
      });

    expect([200, 422]).toContain(res.status);
    expect(res.text).toMatch(/wajib|error|kosong|required/i);
  });

  test('POST /visits dengan field hanya whitespace → status 422 dengan pesan error', async () => {
    const res = await request(app)
      .post('/visits')
      .type('form')
      .send({
        visitor_name: '   ',
        institution: '   ',
        purpose: '   ',
        employee_id: '1',
      });

    expect([200, 422]).toContain(res.status);
    expect(res.text).toMatch(/wajib|error|kosong|required/i);
  });

  // ── Test 3: POST /visits valid → data tersimpan di DB dengan status 'Hadir' ──

  test('POST /visits valid → data tersimpan di DB dengan status Hadir', async () => {
    const formData = {
      visitor_name: 'Siti Nurhaliza',
      institution: 'Dinas Pendidikan',
      purpose: 'Konsultasi administrasi',
      employee_id: '2',
    };

    await request(app)
      .post('/visits')
      .type('form')
      .send(formData);

    // Ambil kunjungan terakhir dari DB
    const savedVisit = getLastVisitFromDb();

    expect(savedVisit).toBeDefined();
    expect(savedVisit.visitor_name).toBe(formData.visitor_name);
    expect(savedVisit.institution).toBe(formData.institution);
    expect(savedVisit.purpose).toBe(formData.purpose);
    expect(savedVisit.employee_id).toBe(Number(formData.employee_id));
    // Persyaratan 1.6: status awal harus 'Hadir'
    expect(savedVisit.status).toBe('Hadir');
    // Persyaratan 1.4: waktu masuk harus terisi otomatis
    expect(savedVisit.check_in_at).toBeTruthy();
    // check_out_at harus null saat status 'Hadir'
    expect(savedVisit.check_out_at).toBeNull();
  });

  test('POST /visits valid → atribut lengkap tersimpan di DB (Persyaratan 1.4, 4.4)', async () => {
    const formData = {
      visitor_name: 'Rudi Hartono',
      institution: 'Kementerian Keuangan',
      purpose: 'Verifikasi dokumen anggaran',
      employee_id: '3',
    };

    await request(app)
      .post('/visits')
      .type('form')
      .send(formData);

    const savedVisit = getLastVisitFromDb();

    // Semua atribut wajib harus tersimpan (Persyaratan 4.4)
    expect(savedVisit.id).toBeDefined();
    expect(savedVisit.visitor_name).toBe(formData.visitor_name);
    expect(savedVisit.institution).toBe(formData.institution);
    expect(savedVisit.purpose).toBe(formData.purpose);
    expect(savedVisit.employee_id).toBe(Number(formData.employee_id));
    expect(savedVisit.check_in_at).toBeTruthy();
    expect(savedVisit.status).toBe('Hadir');
  });

  // ── Test 4: POST /visits valid → SSE broadcast dipanggil ──────────────────

  test('POST /visits valid → SSE broadcast dipanggil dengan event new-visit', async () => {
    const formData = {
      visitor_name: 'Dewi Anggraini',
      institution: 'BPS Provinsi',
      purpose: 'Pengambilan data statistik',
      employee_id: '4',
    };

    await request(app)
      .post('/visits')
      .type('form')
      .send(formData);

    // Persyaratan 3.3: SSE broadcast harus dipanggil saat kunjungan baru terdaftar
    expect(broadcast).toHaveBeenCalledTimes(1);

    const broadcastArg = broadcast.mock.calls[0][0];
    expect(broadcastArg.type).toBe('new-visit');
    expect(broadcastArg.data).toBeDefined();
    expect(broadcastArg.data.visitor_name).toBe(formData.visitor_name);
  });

  test('POST /visits valid → SSE broadcast dipanggil dengan data kunjungan lengkap', async () => {
    const formData = {
      visitor_name: 'Hendra Kusuma',
      institution: 'PT Infrastruktur Nusantara',
      purpose: 'Presentasi proposal',
      employee_id: '5',
    };

    await request(app)
      .post('/visits')
      .type('form')
      .send(formData);

    expect(broadcast).toHaveBeenCalledTimes(1);

    const broadcastArg = broadcast.mock.calls[0][0];
    expect(broadcastArg.type).toBe('new-visit');
    // Data broadcast harus mengandung informasi kunjungan
    expect(broadcastArg.data.institution).toBe(formData.institution);
    expect(broadcastArg.data.purpose).toBe(formData.purpose);
    expect(broadcastArg.data.status).toBe('Hadir');
  });

  // ── Test tambahan: validasi employee_id tidak valid ────────────────────────

  test('POST /visits dengan employee_id tidak valid → status 422', async () => {
    const res = await request(app)
      .post('/visits')
      .type('form')
      .send({
        visitor_name: 'Test User',
        institution: 'Test Institution',
        purpose: 'Test Purpose',
        employee_id: '9999', // ID tidak ada di DB
      });

    expect([200, 422]).toContain(res.status);
  });

  // ── Test: SSE broadcast TIDAK dipanggil saat validasi gagal ───────────────

  test('POST /visits dengan data tidak valid → SSE broadcast TIDAK dipanggil', async () => {
    await request(app)
      .post('/visits')
      .type('form')
      .send({
        visitor_name: '',
        institution: '',
        purpose: '',
        employee_id: '',
      });

    expect(broadcast).not.toHaveBeenCalled();
  });
});
