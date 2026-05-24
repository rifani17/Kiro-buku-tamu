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

describe('Integration: Alur Autentikasi (Auth Flow)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    testDb.prepare('DELETE FROM visits').run();
  });

  afterAll(() => {
    testDb.close();
  });

  test('POST /auth/login dengan kredensial valid -> redirect ke /dashboard', async () => {
    const agent = request.agent(app);

    const res = await agent
      .post('/auth/login')
      .type('form')
      .send({ username: 'admin', password: 'admin123' });

    expect(res.status).toBe(302);
    expect(res.headers.location).toBe('/dashboard');
  });

  test('POST /auth/login dengan kredensial salah -> render login dengan pesan error', async () => {
    const res = await request(app)
      .post('/auth/login')
      .type('form')
      .send({ username: 'admin', password: 'salah' });

    expect(res.status).toBe(200);
    expect(res.text).toContain('Nama pengguna atau kata sandi salah');
    expect(res.text).toContain('Login Petugas');
  });

  test('GET /dashboard tanpa sesi -> redirect ke /auth/login', async () => {
    const res = await request(app).get('/dashboard');

    expect(res.status).toBe(302);
    expect(res.headers.location).toBe('/auth/login');
  });

  test('POST /auth/logout dengan sesi aktif -> redirect ke /auth/login', async () => {
    const agent = request.agent(app);

    await agent
      .post('/auth/login')
      .type('form')
      .send({ username: 'admin', password: 'admin123' });

    const res = await agent.post('/auth/logout');

    expect(res.status).toBe(302);
    expect(res.headers.location).toBe('/auth/login');
  });
});
