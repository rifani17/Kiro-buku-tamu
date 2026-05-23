'use strict';

const path = require('path');

module.exports = {
  PORT: process.env.PORT || 3000,

  SESSION_SECRET: process.env.SESSION_SECRET || 'buku-tamu-secret-key-change-in-production',

  DB_PATH: process.env.DB_PATH || path.join(__dirname, '..', 'data', 'buku_tamu.db'),

  WA_GATEWAY_URL: process.env.WA_GATEWAY_URL || 'http://localhost:3001/send',
};
