'use strict';

const path = require('path');

function getSessionSecret() {
  const envSecret = process.env.SESSION_SECRET;
  if (envSecret) return envSecret;

  if (process.env.NODE_ENV === 'production') {
    throw new Error('SESSION_SECRET environment variable is required in production');
  }

  console.warn('[Config] WARNING: Using default session secret. Set SESSION_SECRET env var for production.');
  return 'dev-secret-change-me-do-not-use-in-production';
}

module.exports = {
  PORT: process.env.PORT || 3000,

  SESSION_SECRET: getSessionSecret(),

  DB_PATH: process.env.DB_PATH || path.join(__dirname, '..', 'data', 'buku_tamu.db'),

  WA_GATEWAY_URL: process.env.WA_GATEWAY_URL || 'http://localhost:3001/send',
};
