'use strict';

const bcrypt = require('bcrypt');
const { getUserByUsername } = require('../models/userModel');

/**
 * Menampilkan halaman login petugas.
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
function showLogin(req, res) {
  res.render('auth/login', { error: null });
}

/**
 * Memproses autentikasi login petugas.
 * Mengambil user dari DB, membandingkan password dengan bcrypt,
 * membuat sesi jika valid, atau menampilkan error jika tidak valid.
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
async function processLogin(req, res) {
  const { username, password } = req.body;

  try {
    const user = getUserByUsername(username);

    if (!user) {
      return res.render('auth/login', {
        error: 'Nama pengguna atau kata sandi salah',
      });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.render('auth/login', {
        error: 'Nama pengguna atau kata sandi salah',
      });
    }

    req.session.userId = user.id;
    console.info(`[Auth] Petugas "${user.username}" berhasil login.`);
    return res.redirect('/dashboard');
  } catch (err) {
    console.error('[Auth] Kesalahan saat proses login:', err);
    return res.render('auth/login', {
      error: 'Terjadi kesalahan sistem, silakan coba lagi',
    });
  }
}

/**
 * Menghancurkan sesi autentikasi dan mengarahkan ke halaman login.
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
function logout(req, res) {
  req.session.destroy((err) => {
    if (err) {
      console.error('[Auth] Kesalahan saat menghancurkan sesi:', err);
    } else {
      console.info('[Auth] Sesi petugas berhasil dihancurkan.');
    }
    res.redirect('/auth/login');
  });
}

module.exports = {
  showLogin,
  processLogin,
  logout,
};
