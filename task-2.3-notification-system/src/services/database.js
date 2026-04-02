const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');
const config = require('../config');

// Ensure data directory exists
const dbDir = path.dirname(config.DB_PATH);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const db = new Database(config.DB_PATH);

// Enable WAL mode for better concurrent read performance
db.pragma('journal_mode = WAL');

// ─── Schema ─────────────────────────────────────────────────────

db.exec(`
  CREATE TABLE IF NOT EXISTS alert_rules (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    campaign_id INTEGER NOT NULL,
    metric      TEXT    NOT NULL CHECK(metric IN ('ctr', 'cpc', 'cpa', 'spend_pct', 'impressions', 'clicks')),
    operator    TEXT    NOT NULL CHECK(operator IN ('<', '>', '<=', '>=', '==')),
    threshold   REAL    NOT NULL,
    severity    TEXT    NOT NULL DEFAULT 'warning' CHECK(severity IN ('info', 'warning', 'critical')),
    enabled     INTEGER NOT NULL DEFAULT 1,
    created_at  TEXT    NOT NULL DEFAULT (datetime('now')),
    updated_at  TEXT    NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS notifications (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    rule_id     INTEGER REFERENCES alert_rules(id),
    campaign_id INTEGER NOT NULL,
    type        TEXT    NOT NULL,
    title       TEXT    NOT NULL,
    message     TEXT    NOT NULL,
    severity    TEXT    NOT NULL DEFAULT 'info',
    read        INTEGER NOT NULL DEFAULT 0,
    created_at  TEXT    NOT NULL DEFAULT (datetime('now'))
  );

  CREATE INDEX IF NOT EXISTS idx_notifications_campaign ON notifications(campaign_id);
  CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);
  CREATE INDEX IF NOT EXISTS idx_notifications_created ON notifications(created_at DESC);
  CREATE INDEX IF NOT EXISTS idx_alert_rules_campaign ON alert_rules(campaign_id);
`);

// ─── Alert Rules CRUD ───────────────────────────────────────────

const alertRulesDb = {
  getAll() {
    return db.prepare('SELECT * FROM alert_rules WHERE enabled = 1 ORDER BY created_at DESC').all();
  },

  getByCampaignId(campaignId) {
    return db.prepare('SELECT * FROM alert_rules WHERE campaign_id = ? AND enabled = 1').all(campaignId);
  },

  getById(id) {
    return db.prepare('SELECT * FROM alert_rules WHERE id = ?').get(id);
  },

  create({ campaign_id, metric, operator, threshold, severity = 'warning' }) {
    const stmt = db.prepare(`
      INSERT INTO alert_rules (campaign_id, metric, operator, threshold, severity)
      VALUES (?, ?, ?, ?, ?)
    `);
    const result = stmt.run(campaign_id, metric, operator, threshold, severity);
    return this.getById(result.lastInsertRowid);
  },

  update(id, { metric, operator, threshold, severity, enabled }) {
    const fields = [];
    const values = [];

    if (metric !== undefined) { fields.push('metric = ?'); values.push(metric); }
    if (operator !== undefined) { fields.push('operator = ?'); values.push(operator); }
    if (threshold !== undefined) { fields.push('threshold = ?'); values.push(threshold); }
    if (severity !== undefined) { fields.push('severity = ?'); values.push(severity); }
    if (enabled !== undefined) { fields.push('enabled = ?'); values.push(enabled ? 1 : 0); }
    fields.push("updated_at = datetime('now')");

    values.push(id);
    db.prepare(`UPDATE alert_rules SET ${fields.join(', ')} WHERE id = ?`).run(...values);
    return this.getById(id);
  },

  delete(id) {
    return db.prepare('DELETE FROM alert_rules WHERE id = ?').run(id);
  },
};

// ─── Notifications CRUD ────────────────────────────────────────

const notificationsDb = {
  getAll({ limit = 50, offset = 0, unread_only = false } = {}) {
    let query = 'SELECT * FROM notifications';
    const params = [];

    if (unread_only) {
      query += ' WHERE read = 0';
    }
    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    return db.prepare(query).all(...params);
  },

  getUnreadCount() {
    return db.prepare('SELECT COUNT(*) as count FROM notifications WHERE read = 0').get().count;
  },

  getById(id) {
    return db.prepare('SELECT * FROM notifications WHERE id = ?').get(id);
  },

  create({ rule_id, campaign_id, type, title, message, severity = 'info' }) {
    const stmt = db.prepare(`
      INSERT INTO notifications (rule_id, campaign_id, type, title, message, severity)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    const result = stmt.run(rule_id, campaign_id, type, title, message, severity);
    return this.getById(result.lastInsertRowid);
  },

  markAsRead(id) {
    db.prepare('UPDATE notifications SET read = 1 WHERE id = ?').run(id);
    return this.getById(id);
  },

  markAllAsRead() {
    return db.prepare('UPDATE notifications SET read = 1 WHERE read = 0').run();
  },

  deleteByCampaignId(campaignId) {
    return db.prepare('DELETE FROM notifications WHERE campaign_id = ?').run(campaignId);
  },
};

module.exports = { alertRulesDb, notificationsDb, db };
