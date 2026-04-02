require('dotenv').config();

module.exports = {
  PORT: process.env.PORT || 3002,
  NODE_ENV: process.env.NODE_ENV || 'development',
  CAMPAIGN_API_URL: process.env.CAMPAIGN_API_URL || 'http://localhost:3000/api',
  CAMPAIGN_API_TOKEN: process.env.CAMPAIGN_API_TOKEN || '',
  POLL_INTERVAL_MS: parseInt(process.env.POLL_INTERVAL_MS, 10) || 30000,
  CORS_ORIGIN: process.env.CORS_ORIGIN || '*',
  DB_PATH: process.env.DB_PATH || './data/notifications.db',
};
