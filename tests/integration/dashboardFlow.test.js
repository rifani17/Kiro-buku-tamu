'use strict';

jest.mock('../../src/database', () => {
  const Database = require('better-sqlite3');
  const runMigration = require('../../src/migrations/001_initial_schema');
  const runSeed = require('../../src/migrations/seed');

  const mockDb = new Database(':memory:');
  runMigration(mockDb);
  runSeed(mockDb);

  return mockDb;
});

jest.mock('../../src/services/sseManager', () => ({
  broadcast: jest.fn(),
  addClient: jest.fn(),
  removeClient: jest.fn(),
}));

jest.mock('../../src/services/notificationService', () => ({
  sendVisitNotification: jest.fn().mockResolvedValue(undefined),
  formatNotificationMessage: jest.fn().mockReturnValue('mock message'),
}));

const request = require('supertest');
const app = require('../../src/app');
const testDb = require('../../src/database');
const { broadcast } = require('../../src/services/sseManager');

function getTodayDate() {
  return new Date().toISOString().slice(0, 10);
}

function addVisit({
  visitor_name,
  institution,
  purpose,
  employee_id,
  check_in_at,
  status = 'Hadir',
}) {
  const stmt = testDb.prepare(`
    INSERT INTO visits (
      visitor_name,
      institution,
      purpose,
      employee_id,
      check_in_at,
      status
    ) VALUES (?, ?, ?, ?, ?, ?)
  `);

  const result = stmt.run(
    visitor_name,
    institution,
    purpose,
    employee_id,
    check_in_at,
    status
  );

  return Number(result.lastInsertRowid);
}

describe('Integration: Alur Dashboard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    testDb.prepare('DELETE FROM visits').run();
  });

  afterAll(() => {
    testDb.close();
  });

  test('GET /dashboard dengan sesi valid -> render dashboard dengan data hari ini', async () => {
    const today = getTodayDate();
    addVisit({
      visitor_name: 'Budi Santoso',
      institution: 'PT Maju Jaya',
      purpose: 'Rapat koordinasi',
      employee_id: 1,
      check_in_at: `${today} 09:00:00`,
    });

    const agent = request.agent(app);
    await agent
      .post('/auth/login')
      .type('form')
      .send({ username: 'admin', password: 'admin123' });

    const res = await agent.get('/dashboard');

    expect(res.status).toBe(200);
    expect(res.text).toContain('Dashboard Petugas');
    expect(res.text).toContain('Budi Santoso');
    expect(res.text).toContain('PT Maju Jaya');
    expect(res.text).toContain('Total Pengunjung Hari Ini');
    expect(res.text).toContain('<h2 class="mb-0 text-primary" id="total-today">1</h2>');
  });

  test('GET /dashboard/visits?date=YYYY-MM-DD -> kembalikan JSON kunjungan untuk tanggal tersebut', async () => {
    const today = getTodayDate();
    const otherDate = '2024-01-01';

    addVisit({
      visitor_name: 'Andi Prasetyo',
      institution: 'PT Teknologi Maju',
      purpose: 'Presentasi',
      employee_id: 2,
      check_in_at: `${today} 10:00:00`,
    });

    addVisit({
      visitor_name: 'Siti Rahayu',
      institution: 'Dinas Pendidikan',
      purpose: 'Konsultasi',
      employee_id: 3,
      check_in_at: `${otherDate} 11:00:00`,
    });

    const agent = request.agent(app);
    await agent
      .post('/auth/login')
      .type('form')
      .send({ username: 'admin', password: 'admin123' });

    const res = await agent.get('/dashboard/visits').query({ date: today });

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.visits)).toBe(true);
    expect(res.body.visits).toHaveLength(1);
    expect(res.body.visits[0].visitor_name).toBe('Andi Prasetyo');
    expect(res.body.visits[0].check_in_at.startsWith(today)).toBe(true);
  });

  test('GET /dashboard/visits?keyword=xxx -> kembalikan JSON kunjungan yang cocok', async () => {
    const today = getTodayDate();

    addVisit({
      visitor_name: 'Dewi Lestari',
      institution: 'Kementerian Keuangan',
      purpose: 'Audit',
      employee_id: 4,
      check_in_at: `${today} 09:30:00`,
    });

    addVisit({
      visitor_name: 'Hendra Kusuma',
      institution: 'BPS Provinsi',
      purpose: 'Data statistik',
      employee_id: 5,
      check_in_at: `${today} 10:15:00`,
    });

    const agent = request.agent(app);
    await agent
      .post('/auth/login')
      .type('form')
      .send({ username: 'admin', password: 'admin123' });

    const res = await agent.get('/dashboard/visits').query({ keyword: 'Dewi' });

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.visits)).toBe(true);
    expect(res.body.visits).toHaveLength(1);
    expect(res.body.visits[0].visitor_name).toBe('Dewi Lestari');
  });

  test('PATCH /dashboard/visits/:id/status dengan sesi valid -> status diperbarui dan SSE broadcast dipanggil', async () => {
    const today = getTodayDate();
    const visitId = addVisit({
      visitor_name: 'Rudi Hartono',
      institution: 'Universitas Negeri',
      purpose: 'Pengambilan dokumen',
      employee_id: 1,
      check_in_at: `${today} 08:45:00`,
    });

    const agent = request.agent(app);
    await agent
      .post('/auth/login')
      .type('form')
      .send({ username: 'admin', password: 'admin123' });

    const res = await agent.patch(`/dashboard/visits/${visitId}/status`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.visit.status).toBe('Selesai');
    expect(res.body.visit.check_out_at).toBeTruthy();

    const updatedRow = testDb
      .prepare('SELECT status, check_out_at FROM visits WHERE id = ?')
      .get(visitId);

    expect(updatedRow.status).toBe('Selesai');
    expect(updatedRow.check_out_at).toBeTruthy();
    expect(broadcast).toHaveBeenCalledTimes(1);
    expect(broadcast.mock.calls[0][0].type).toBe('status-update');
    expect(broadcast.mock.calls[0][0].data.id).toBe(visitId);
  });

  test('PATCH /dashboard/visits/:id/status tanpa sesi -> redirect ke /auth/login', async () => {
    const today = getTodayDate();
    const visitId = addVisit({
      visitor_name: 'Citra Dewi',
      institution: 'Bagian Umum',
      purpose: 'Koordinasi',
      employee_id: 2,
      check_in_at: `${today} 12:00:00`,
    });

    const res = await request(app).patch(`/dashboard/visits/${visitId}/status`);

    expect(res.status).toBe(302);
    expect(res.headers.location).toBe('/auth/login');
  });
});
