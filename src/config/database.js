const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const DB_PATH = process.env.DB_PATH || path.join(__dirname, '..', '..', 'data', 'campaigns.db');

// Ensure data directory exists
const dataDir = path.dirname(DB_PATH);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const db = new Database(DB_PATH);

// Enable WAL mode for better performance
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

/**
 * Initialize tables and seed data
 */
function initializeDatabase() {
  // ── Users table ──
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      email         TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      name          TEXT NOT NULL,
      created_at    TEXT DEFAULT (datetime('now'))
    )
  `);

  // ── Campaigns table ──
  db.exec(`
    CREATE TABLE IF NOT EXISTS campaigns (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      name          TEXT NOT NULL,
      description   TEXT,
      status        TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'completed')),
      budget        REAL NOT NULL CHECK (budget >= 0),
      spend         REAL NOT NULL DEFAULT 0 CHECK (spend >= 0),
      start_date    TEXT NOT NULL,
      end_date      TEXT NOT NULL,
      impressions   INTEGER NOT NULL DEFAULT 0 CHECK (impressions >= 0),
      clicks        INTEGER NOT NULL DEFAULT 0 CHECK (clicks >= 0),
      conversions   INTEGER NOT NULL DEFAULT 0 CHECK (conversions >= 0),
      user_id       INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      created_at    TEXT DEFAULT (datetime('now')),
      updated_at    TEXT DEFAULT (datetime('now')),
      deleted_at    TEXT DEFAULT NULL
    )
  `);

  // ── Indexes ──
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_campaigns_status     ON campaigns(status);
    CREATE INDEX IF NOT EXISTS idx_campaigns_user_id    ON campaigns(user_id);
    CREATE INDEX IF NOT EXISTS idx_campaigns_deleted_at ON campaigns(deleted_at);
    CREATE INDEX IF NOT EXISTS idx_campaigns_start_date ON campaigns(start_date);
    CREATE INDEX IF NOT EXISTS idx_users_email          ON users(email);
  `);

  // ── Seed admin user (password: admin123) ──
  const existingUser = db.prepare('SELECT id FROM users WHERE email = ?').get('admin@agency.com');
  if (!existingUser) {
    const hash = bcrypt.hashSync('admin123', 10);
    db.prepare('INSERT INTO users (email, password_hash, name) VALUES (?, ?, ?)').run(
      'admin@agency.com', hash, 'Admin User'
    );
    console.log('👤 Seeded admin user: admin@agency.com / admin123');

    // ── Seed sample campaigns ──
    const insertCampaign = db.prepare(`
      INSERT INTO campaigns (name, description, status, budget, spend, start_date, end_date, impressions, clicks, conversions, user_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
    `);

    const campaigns = [
      ['Summer Sale 2025',         'Seasonal promotion for summer product line',        'active',    15000.00, 8750.50,  '2025-06-01', '2025-08-31', 450000,  12500, 890],
      ['Brand Awareness Q3',       'Increase brand visibility across social platforms', 'active',    25000.00, 12300.00, '2025-07-01', '2025-09-30', 820000,  24000, 1560],
      ['Product Launch — Widget X','Launch campaign for new Widget X product',          'paused',    50000.00, 22000.00, '2025-05-15', '2025-07-15', 1200000, 35000, 2800],
      ['Holiday Promo 2024',       'Holiday season promotional campaign',               'completed', 30000.00, 29500.00, '2024-11-15', '2024-12-31', 950000,  28000, 3200],
      ['Spring Collection',        'Spring fashion collection digital campaign',        'active',    18000.00, 5200.00,  '2025-03-01', '2025-05-31', 320000,  9800,  620],
      ['Retargeting — Cart Abandon','Retarget users who abandoned shopping carts',      'active',    8000.00,  3400.00,  '2025-04-01', '2025-06-30', 180000,  8500,  1100],
      ['Influencer Collab Q2',     'Influencer partnership campaign for Q2',            'paused',    40000.00, 15000.00, '2025-04-01', '2025-06-30', 600000,  18000, 1400],
      ['Email Re-engagement',      'Re-engage dormant email subscribers',               'completed', 5000.00,  4800.00,  '2025-01-01', '2025-03-31', 120000,  6500,  950],
      ['Mobile App Install',       'Drive mobile app installations via paid ads',       'active',    35000.00, 18000.00, '2025-05-01', '2025-07-31', 750000,  22000, 1800],
      ['Video Campaign — YouTube', 'YouTube pre-roll and discovery ads',                'active',    20000.00, 9200.00,  '2025-06-15', '2025-09-15', 500000,  15000, 980],
    ];

    const seedMany = db.transaction((items) => {
      for (const c of items) insertCampaign.run(...c);
    });
    seedMany(campaigns);
    console.log(`📊 Seeded ${campaigns.length} sample campaigns`);
  }
}

/**
 * Query wrapper — provides a pg-compatible interface over better-sqlite3
 * Handles SELECT, INSERT/UPDATE/DELETE with RETURNING * support
 */
function query(sql, params = []) {
  const trimmed = sql.trim();
  const upper = trimmed.toUpperCase();

  // SELECT queries
  if (upper.startsWith('SELECT') || upper.startsWith('WITH')) {
    const rows = db.prepare(trimmed).all(...params);
    return { rows };
  }

  // INSERT with RETURNING *
  if (upper.startsWith('INSERT') && upper.includes('RETURNING')) {
    const cleanSql = trimmed.replace(/\s*RETURNING\s+\*/i, '');
    const info = db.prepare(cleanSql).run(...params);
    const table = (sql.match(/INTO\s+(\w+)/i) || [])[1];
    if (table && info.changes > 0) {
      const row = db.prepare(`SELECT * FROM ${table} WHERE id = ?`).get(info.lastInsertRowid);
      return { rows: row ? [row] : [] };
    }
    return { rows: [] };
  }

  // UPDATE with RETURNING *
  if (upper.startsWith('UPDATE') && upper.includes('RETURNING')) {
    const table = (sql.match(/UPDATE\s+(\w+)/i) || [])[1];
    // Extract WHERE clause conditions to find the row after update
    const whereMatch = trimmed.match(/WHERE\s+(.+?)(?:\s+RETURNING)/i);
    const whereClause = whereMatch ? whereMatch[1] : null;

    const cleanSql = trimmed.replace(/\s*RETURNING\s+\*/i, '');
    const info = db.prepare(cleanSql).run(...params);

    if (table && info.changes > 0 && whereClause) {
      // The id is typically the last parameter before any RETURNING clause
      // For our use case, the id is always the last param
      const idParam = params[params.length - 1];
      const row = db.prepare(`SELECT * FROM ${table} WHERE id = ?`).get(idParam);
      return { rows: row ? [row] : [] };
    }
    return { rows: [] };
  }

  // Plain INSERT / UPDATE / DELETE
  if (upper.startsWith('INSERT') || upper.startsWith('UPDATE') || upper.startsWith('DELETE')) {
    const info = db.prepare(trimmed).run(...params);
    return { rows: [], changes: info.changes };
  }

  // DDL / other
  db.exec(trimmed);
  return { rows: [] };
}

module.exports = {
  query,
  db,
  initializeDatabase,
};
