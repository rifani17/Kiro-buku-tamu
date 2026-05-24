'use strict';

// Mock axios sebelum require apapun agar semua modul menggunakan mock yang sama
jest.mock('axios');
const axios = require('axios');
const { formatNotificationMessage, sendVisitNotification } = require('../../src/services/notificationService');

// ---------------------------------------------------------------------------
// Data fixture
// ---------------------------------------------------------------------------

const sampleVisit = {
  id: 1,
  visitor_name: 'Budi Santoso',
  institution: 'PT Maju Jaya',
  purpose: 'Rapat koordinasi',
  employee_id: 2,
  check_in_at: '2024-01-15 09:00:00',
  status: 'Hadir',
};

const employeeWithWA = {
  id: 2,
  name: 'Andi Wijaya',
  department: 'Bagian Umum',
  whatsapp_no: '6281234567890',
};

const employeeWithoutWA = {
  id: 3,
  name: 'Siti Rahayu',
  department: 'Keuangan',
  whatsapp_no: null,
};

// ---------------------------------------------------------------------------
// formatNotificationMessage
// ---------------------------------------------------------------------------

describe('formatNotificationMessage', () => {
  test('mengandung visitor_name dalam pesan', () => {
    const msg = formatNotificationMessage(sampleVisit);
    expect(msg).toContain(sampleVisit.visitor_name);
  });

  test('mengandung institution dalam pesan', () => {
    const msg = formatNotificationMessage(sampleVisit);
    expect(msg).toContain(sampleVisit.institution);
  });

  test('mengandung purpose dalam pesan', () => {
    const msg = formatNotificationMessage(sampleVisit);
    expect(msg).toContain(sampleVisit.purpose);
  });

  test('mengandung check_in_at dalam pesan', () => {
    const msg = formatNotificationMessage(sampleVisit);
    expect(msg).toContain(sampleVisit.check_in_at);
  });

  test('mengembalikan string', () => {
    const msg = formatNotificationMessage(sampleVisit);
    expect(typeof msg).toBe('string');
  });

  test('pesan tidak kosong', () => {
    const msg = formatNotificationMessage(sampleVisit);
    expect(msg.length).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------------
// sendVisitNotification — graceful error handling
// ---------------------------------------------------------------------------

describe('sendVisitNotification', () => {
  beforeEach(() => {
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    jest.spyOn(console, 'info').mockImplementation(() => {});
    // Reset semua mock axios sebelum setiap test
    jest.clearAllMocks();
    // Spy console ulang setelah clearAllMocks
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    jest.spyOn(console, 'info').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('tidak melempar exception ketika pegawai tidak memiliki nomor WA', async () => {
    await expect(
      sendVisitNotification(sampleVisit, employeeWithoutWA)
    ).resolves.toBeUndefined();
  });

  test('mencatat log info ketika pegawai tidak memiliki nomor WA', async () => {
    await sendVisitNotification(sampleVisit, employeeWithoutWA);
    expect(console.info).toHaveBeenCalled();
  });

  test('tidak melempar exception ketika employee adalah null', async () => {
    await expect(
      sendVisitNotification(sampleVisit, null)
    ).resolves.toBeUndefined();
  });

  test('tidak melempar exception ketika axios gagal (network error)', async () => {
    axios.post.mockRejectedValue(new Error('Network Error'));

    await expect(
      sendVisitNotification(sampleVisit, employeeWithWA)
    ).resolves.toBeUndefined();
  });

  test('mencatat console.warn ketika axios gagal', async () => {
    axios.post.mockRejectedValue(new Error('Connection refused'));

    await sendVisitNotification(sampleVisit, employeeWithWA);
    expect(console.warn).toHaveBeenCalled();
  });

  test('tidak melempar exception ketika axios gagal dengan HTTP error', async () => {
    const httpError = new Error('Request failed with status code 500');
    httpError.response = { status: 500, data: 'Internal Server Error' };
    axios.post.mockRejectedValue(httpError);

    await expect(
      sendVisitNotification(sampleVisit, employeeWithWA)
    ).resolves.toBeUndefined();
  });

  test('mencatat console.info ketika notifikasi berhasil dikirim', async () => {
    axios.post.mockResolvedValue({ status: 200, data: 'OK' });

    await sendVisitNotification(sampleVisit, employeeWithWA);
    expect(console.info).toHaveBeenCalled();
  });
});
