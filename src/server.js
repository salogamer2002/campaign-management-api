require('dotenv').config();
const app = require('./app');
const { initializeDatabase } = require('./config/database');

const PORT = process.env.PORT || 3000;

// Initialize database (create tables + seed data)
try {
  initializeDatabase();
  console.log('✅ Database initialized');
} catch (err) {
  console.error('❌ Failed to initialize database:', err.message);
}

// Only start listener when running locally (not on Vercel serverless)
if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`
╔══════════════════════════════════════════════════╗
║       Campaign Management API                    ║
║──────────────────────────────────────────────────║
║  🚀  Server:     http://localhost:${PORT}            ║
║  📦  Database:   SQLite (./data/campaigns.db)    ║
║  🔐  Auth:       JWT Bearer tokens               ║
║  ⏱️   Rate Limit: 100 req/min per IP              ║
║  📖  API Docs:   http://localhost:${PORT}/api-docs   ║
║──────────────────────────────────────────────────║
║  Login:  admin@agency.com / admin123             ║
╚══════════════════════════════════════════════════╝
    `);
  });
}

// Export for Vercel serverless
module.exports = app;

