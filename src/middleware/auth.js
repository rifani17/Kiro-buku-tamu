/**
 * Middleware Autentikasi
 * Memastikan request berasal dari sesi yang terautentikasi.
 */

/**
 * Memeriksa apakah request memiliki sesi yang valid.
 * Jika tidak, redirect ke halaman login.
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
function requireAuth(req, res, next) {
  if (req.session && req.session.userId) {
    return next();
  }
  return res.redirect('/auth/login');
}

module.exports = { requireAuth };
