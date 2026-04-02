const db = require('../config/database');

/**
 * Convert a value to a date string (YYYY-MM-DD).
 * Joi's date() validator converts strings to Date objects, but SQLite only binds primitives.
 */
function toDateString(val) {
  if (!val) return val;
  if (val instanceof Date) return val.toISOString().split('T')[0];
  return String(val);
}

/**
 * Campaign Model — SQL queries (SQLite compatible)
 */
const CampaignModel = {
  /**
   * List campaigns with filtering, sorting, and pagination
   */
  async findAll({ status, sort_by, sort_order, page, limit, search }) {
    const conditions = ['c.deleted_at IS NULL'];
    const params = [];

    // Filter by status
    if (status) {
      conditions.push('c.status = ?');
      params.push(status);
    }

    // Search by name
    if (search) {
      conditions.push('c.name LIKE ?');
      params.push(`%${search}%`);
    }

    const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    // Sorting — whitelist allowed columns
    const allowedSortColumns = [
      'name', 'status', 'budget', 'spend', 'start_date', 'end_date',
      'impressions', 'clicks', 'conversions', 'created_at', 'updated_at',
    ];
    const sortColumn = allowedSortColumns.includes(sort_by) ? sort_by : 'created_at';
    const sortDir = sort_order === 'asc' ? 'ASC' : 'DESC';

    // Pagination
    const offset = (page - 1) * limit;

    // Count total for pagination metadata
    const countQuery = `SELECT COUNT(*) as count FROM campaigns c ${whereClause}`;
    const countResult = db.query(countQuery, params);
    const total = parseInt(countResult.rows[0].count, 10);

    // Fetch rows
    const dataQuery = `
      SELECT c.*, u.name AS owner_name, u.email AS owner_email
      FROM campaigns c
      JOIN users u ON c.user_id = u.id
      ${whereClause}
      ORDER BY c.${sortColumn} ${sortDir}
      LIMIT ? OFFSET ?
    `;
    const dataResult = db.query(dataQuery, [...params, limit, offset]);

    return {
      campaigns: dataResult.rows,
      pagination: {
        total,
        page,
        limit,
        total_pages: Math.ceil(total / limit),
      },
    };
  },

  /**
   * Find a single campaign by ID (excluding soft-deleted)
   */
  async findById(id) {
    const query = `
      SELECT c.*, u.name AS owner_name, u.email AS owner_email,
        CASE WHEN c.impressions > 0 
          THEN ROUND((CAST(c.clicks AS REAL) / c.impressions) * 100, 2) 
          ELSE 0 
        END AS ctr,
        CASE WHEN c.clicks > 0 
          THEN ROUND(c.spend / c.clicks, 2)
          ELSE 0 
        END AS cpc,
        CASE WHEN c.conversions > 0 
          THEN ROUND(c.spend / c.conversions, 2) 
          ELSE 0 
        END AS cpa,
        CASE WHEN c.impressions > 0 
          THEN ROUND((CAST(c.conversions AS REAL) / c.impressions) * 100, 4) 
          ELSE 0 
        END AS conversion_rate
      FROM campaigns c
      JOIN users u ON c.user_id = u.id
      WHERE c.id = ? AND c.deleted_at IS NULL
    `;
    const result = db.query(query, [id]);
    return result.rows[0] || null;
  },

  /**
   * Create a new campaign
   */
  async create(data, userId) {
    const query = `
      INSERT INTO campaigns 
        (name, description, status, budget, spend, start_date, end_date, 
         impressions, clicks, conversions, user_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      RETURNING *
    `;
    const values = [
      data.name,
      data.description || null,
      data.status || 'active',
      data.budget,
      data.spend || 0,
      toDateString(data.start_date),
      toDateString(data.end_date),
      data.impressions || 0,
      data.clicks || 0,
      data.conversions || 0,
      userId,
    ];
    const result = db.query(query, values);
    return result.rows[0];
  },

  /**
   * Update campaign by ID
   */
  async update(id, data) {
    // Dynamically build SET clause from provided fields
    const fields = [];
    const values = [];

    const allowedFields = [
      'name', 'description', 'status', 'budget', 'spend',
      'start_date', 'end_date', 'impressions', 'clicks', 'conversions',
    ];

    for (const field of allowedFields) {
      if (data[field] !== undefined) {
        fields.push(`${field} = ?`);
        // Convert Date objects to strings for SQLite compatibility
        const val = (field === 'start_date' || field === 'end_date')
          ? toDateString(data[field])
          : data[field];
        values.push(val);
      }
    }

    // Always update updated_at
    fields.push(`updated_at = datetime('now')`);

    const query = `
      UPDATE campaigns
      SET ${fields.join(', ')}
      WHERE id = ? AND deleted_at IS NULL
      RETURNING *
    `;
    values.push(id);

    const result = db.query(query, values);
    return result.rows[0] || null;
  },

  /**
   * Soft delete campaign (set deleted_at timestamp)
   */
  async softDelete(id) {
    const query = `
      UPDATE campaigns
      SET deleted_at = datetime('now'), updated_at = datetime('now')
      WHERE id = ? AND deleted_at IS NULL
      RETURNING *
    `;
    const result = db.query(query, [id]);
    return result.rows[0] || null;
  },
};

module.exports = CampaignModel;
