'use strict';

const { filterByKeyword, filterByDate } = require('../../src/utils/filters');

// ---------------------------------------------------------------------------
// Data fixture
// ---------------------------------------------------------------------------

const visits = [
  {
    id: 1,
    visitor_name: 'Budi Santoso',
    institution: 'PT Maju Jaya',
    purpose: 'Rapat koordinasi',
    employee_id: 1,
    employee_name: 'Andi Wijaya',
    check_in_at: '2024-01-15 09:00:00',
    check_out_at: null,
    status: 'Hadir',
  },
  {
    id: 2,
    visitor_name: 'Siti Rahayu',
    institution: 'Dinas Pendidikan',
    purpose: 'Konsultasi',
    employee_id: 2,
    employee_name: 'Budi Hartono',
    check_in_at: '2024-01-15 10:30:00',
    check_out_at: null,
    status: 'Hadir',
  },
  {
    id: 3,
    visitor_name: 'Ahmad Fauzi',
    institution: 'Universitas Negeri',
    purpose: 'Pengambilan dokumen',
    employee_id: 1,
    employee_name: 'Andi Wijaya',
    check_in_at: '2024-01-16 08:45:00',
    check_out_at: '2024-01-16 09:30:00',
    status: 'Selesai',
  },
  {
    id: 4,
    visitor_name: 'Dewi Lestari',
    institution: 'Kementerian Keuangan',
    purpose: 'Audit',
    employee_id: 3,
    employee_name: 'Citra Dewi',
    check_in_at: '2024-01-16 13:00:00',
    check_out_at: null,
    status: 'Hadir',
  },
];

// ---------------------------------------------------------------------------
// filterByKeyword
// ---------------------------------------------------------------------------

describe('filterByKeyword', () => {
  describe('pencocokan visitor_name', () => {
    test('mengembalikan kunjungan yang visitor_name-nya mengandung keyword (case-insensitive)', () => {
      const result = filterByKeyword(visits, 'budi');
      // "Budi Santoso" cocok; "Budi Hartono" adalah employee_name bukan visitor_name
      expect(result.some((v) => v.visitor_name === 'Budi Santoso')).toBe(true);
    });

    test('pencarian case-insensitive untuk visitor_name', () => {
      const lower = filterByKeyword(visits, 'siti');
      const upper = filterByKeyword(visits, 'SITI');
      const mixed = filterByKeyword(visits, 'SiTi');
      expect(lower).toEqual(upper);
      expect(lower).toEqual(mixed);
      expect(lower.length).toBeGreaterThan(0);
    });
  });

  describe('pencocokan employee_name', () => {
    test('mengembalikan kunjungan yang employee_name-nya mengandung keyword', () => {
      const result = filterByKeyword(visits, 'Andi');
      expect(result.every((v) => v.employee_name === 'Andi Wijaya')).toBe(true);
      expect(result.length).toBe(2); // id 1 dan 3
    });

    test('pencarian employee_name case-insensitive', () => {
      const result = filterByKeyword(visits, 'citra');
      expect(result.length).toBe(1);
      expect(result[0].id).toBe(4);
    });
  });

  describe('pencocokan OR (visitor_name ATAU employee_name)', () => {
    test('mengembalikan kunjungan yang cocok di visitor_name atau employee_name', () => {
      // "Budi Santoso" (visitor) dan "Budi Hartono" (employee)
      const result = filterByKeyword(visits, 'budi');
      const ids = result.map((v) => v.id);
      expect(ids).toContain(1); // visitor_name = Budi Santoso
      expect(ids).toContain(2); // employee_name = Budi Hartono
    });
  });

  describe('keyword tidak ditemukan', () => {
    test('mengembalikan array kosong jika tidak ada yang cocok', () => {
      const result = filterByKeyword(visits, 'xyz_tidak_ada');
      expect(result).toEqual([]);
    });
  });

  describe('keyword kosong atau tidak valid', () => {
    test('mengembalikan semua kunjungan jika keyword string kosong', () => {
      expect(filterByKeyword(visits, '')).toEqual(visits);
    });

    test('mengembalikan semua kunjungan jika keyword hanya whitespace', () => {
      expect(filterByKeyword(visits, '   ')).toEqual(visits);
    });

    test('mengembalikan semua kunjungan jika keyword null', () => {
      expect(filterByKeyword(visits, null)).toEqual(visits);
    });

    test('mengembalikan semua kunjungan jika keyword undefined', () => {
      expect(filterByKeyword(visits, undefined)).toEqual(visits);
    });
  });

  describe('input visits tidak valid', () => {
    test('mengembalikan array kosong jika visits bukan array', () => {
      expect(filterByKeyword(null, 'budi')).toEqual([]);
      expect(filterByKeyword(undefined, 'budi')).toEqual([]);
      expect(filterByKeyword('string', 'budi')).toEqual([]);
    });

    test('mengembalikan array kosong jika visits adalah array kosong', () => {
      expect(filterByKeyword([], 'budi')).toEqual([]);
    });
  });

  describe('field yang hilang pada objek kunjungan', () => {
    test('tidak error jika visitor_name atau employee_name tidak ada', () => {
      const partial = [{ id: 99, visitor_name: 'Test User' }];
      expect(() => filterByKeyword(partial, 'test')).not.toThrow();
      expect(filterByKeyword(partial, 'test').length).toBe(1);
    });
  });
});

// ---------------------------------------------------------------------------
// filterByDate
// ---------------------------------------------------------------------------

describe('filterByDate', () => {
  describe('filter berdasarkan tanggal', () => {
    test('mengembalikan hanya kunjungan pada tanggal yang dipilih', () => {
      const result = filterByDate(visits, '2024-01-15');
      expect(result.length).toBe(2);
      expect(result.every((v) => v.check_in_at.startsWith('2024-01-15'))).toBe(true);
    });

    test('mengembalikan kunjungan dari tanggal berbeda', () => {
      const result = filterByDate(visits, '2024-01-16');
      expect(result.length).toBe(2);
      expect(result.every((v) => v.check_in_at.startsWith('2024-01-16'))).toBe(true);
    });

    test('tidak ada kunjungan yang bocor ke tanggal lain', () => {
      const result = filterByDate(visits, '2024-01-15');
      expect(result.some((v) => v.check_in_at.startsWith('2024-01-16'))).toBe(false);
    });
  });

  describe('tanggal tidak ditemukan', () => {
    test('mengembalikan array kosong jika tidak ada kunjungan pada tanggal tersebut', () => {
      const result = filterByDate(visits, '2024-01-01');
      expect(result).toEqual([]);
    });
  });

  describe('format datetime yang didukung', () => {
    test('mendukung format ISO dengan spasi: "YYYY-MM-DD HH:MM:SS"', () => {
      const result = filterByDate(visits, '2024-01-15');
      expect(result.length).toBe(2);
    });

    test('mendukung format ISO dengan T: "YYYY-MM-DDTHH:MM:SS"', () => {
      const isoVisits = [
        { id: 10, visitor_name: 'Test', employee_name: 'Emp', check_in_at: '2024-03-20T14:00:00' },
      ];
      const result = filterByDate(isoVisits, '2024-03-20');
      expect(result.length).toBe(1);
    });
  });

  describe('tanggal kosong atau tidak valid', () => {
    test('mengembalikan semua kunjungan jika tanggal string kosong', () => {
      expect(filterByDate(visits, '')).toEqual(visits);
    });

    test('mengembalikan semua kunjungan jika tanggal null', () => {
      expect(filterByDate(visits, null)).toEqual(visits);
    });

    test('mengembalikan semua kunjungan jika tanggal undefined', () => {
      expect(filterByDate(visits, undefined)).toEqual(visits);
    });
  });

  describe('input visits tidak valid', () => {
    test('mengembalikan array kosong jika visits bukan array', () => {
      expect(filterByDate(null, '2024-01-15')).toEqual([]);
      expect(filterByDate(undefined, '2024-01-15')).toEqual([]);
    });

    test('mengembalikan array kosong jika visits adalah array kosong', () => {
      expect(filterByDate([], '2024-01-15')).toEqual([]);
    });
  });
});
