'use strict';

/**
 * Pesan error validasi untuk setiap field form tamu.
 */
const ERROR_MESSAGES = {
  visitor_name: 'Nama lengkap wajib diisi',
  institution: 'Instansi/asal wajib diisi',
  purpose: 'Keperluan kunjungan wajib diisi',
  employee_id: 'Tujuan kunjungan wajib dipilih',
};

/**
 * Batas panjang maksimum untuk setiap field.
 */
const MAX_LENGTH = {
  visitor_name: 255,
  institution: 255,
  purpose: 500,
};

/**
 * Memeriksa apakah nilai string kosong atau hanya berisi whitespace.
 * @param {*} value
 * @returns {boolean}
 */
function isBlank(value) {
  return value === undefined || value === null || String(value).trim() === '';
}

/**
 * Memeriksa apakah nilai merupakan integer valid (bilangan bulat positif).
 * @param {*} value
 * @returns {boolean}
 */
function isValidInteger(value) {
  if (isBlank(value)) return false;
  const num = Number(value);
  return Number.isInteger(num) && num > 0;
}

/**
 * Memvalidasi input form tamu.
 *
 * Aturan validasi:
 * - visitor_name : wajib, tidak boleh hanya whitespace, max 255 karakter
 * - institution  : wajib, tidak boleh hanya whitespace, max 255 karakter
 * - purpose      : wajib, tidak boleh hanya whitespace, max 500 karakter
 * - employee_id  : wajib, harus berupa integer valid (> 0)
 *                  (keberadaan di tabel employees diperiksa di level controller)
 *
 * @param {{ visitor_name?: any, institution?: any, purpose?: any, employee_id?: any }} input
 * @returns {{ valid: boolean, errors: { visitor_name: string|null, institution: string|null, purpose: string|null, employee_id: string|null } }}
 */
function validateVisitForm(input) {
  const errors = {
    visitor_name: null,
    institution: null,
    purpose: null,
    employee_id: null,
  };

  // --- visitor_name ---
  if (isBlank(input.visitor_name)) {
    errors.visitor_name = ERROR_MESSAGES.visitor_name;
  } else if (String(input.visitor_name).trim().length > MAX_LENGTH.visitor_name) {
    errors.visitor_name = `Nama lengkap maksimal ${MAX_LENGTH.visitor_name} karakter`;
  }

  // --- institution ---
  if (isBlank(input.institution)) {
    errors.institution = ERROR_MESSAGES.institution;
  } else if (String(input.institution).trim().length > MAX_LENGTH.institution) {
    errors.institution = `Instansi/asal maksimal ${MAX_LENGTH.institution} karakter`;
  }

  // --- purpose ---
  if (isBlank(input.purpose)) {
    errors.purpose = ERROR_MESSAGES.purpose;
  } else if (String(input.purpose).trim().length > MAX_LENGTH.purpose) {
    errors.purpose = `Keperluan kunjungan maksimal ${MAX_LENGTH.purpose} karakter`;
  }

  // --- employee_id ---
  if (!isValidInteger(input.employee_id)) {
    errors.employee_id = ERROR_MESSAGES.employee_id;
  }

  const valid = Object.values(errors).every((e) => e === null);

  return { valid, errors };
}

module.exports = { validateVisitForm };
