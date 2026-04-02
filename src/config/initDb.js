/**
 * Database Initialization Script
 * Run this to create tables and seed data:  npm run db:init
 */
const { initializeDatabase } = require('./database');

try {
  console.log('🔄 Initializing database...');
  initializeDatabase();
  console.log('✅ Database initialized successfully — tables created & seed data inserted.');
} catch (err) {
  console.error('❌ Database initialization failed:', err.message);
  process.exit(1);
}
