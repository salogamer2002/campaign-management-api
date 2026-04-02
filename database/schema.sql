-- ============================================================
-- Campaign Management API — PostgreSQL Schema
-- ============================================================

-- Create database (run manually if needed):
-- CREATE DATABASE campaigns_db;

-- ============================================================
-- USERS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
    id              SERIAL PRIMARY KEY,
    email           VARCHAR(255) UNIQUE NOT NULL,
    password_hash   VARCHAR(255) NOT NULL,
    name            VARCHAR(255) NOT NULL,
    created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================
-- CAMPAIGNS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS campaigns (
    id              SERIAL PRIMARY KEY,
    name            VARCHAR(255) NOT NULL,
    description     TEXT,
    status          VARCHAR(20) NOT NULL DEFAULT 'active'
                    CHECK (status IN ('active', 'paused', 'completed')),
    budget          DECIMAL(12, 2) NOT NULL CHECK (budget >= 0),
    spend           DECIMAL(12, 2) NOT NULL DEFAULT 0 CHECK (spend >= 0),
    start_date      DATE NOT NULL,
    end_date        DATE NOT NULL,
    impressions     BIGINT NOT NULL DEFAULT 0 CHECK (impressions >= 0),
    clicks          BIGINT NOT NULL DEFAULT 0 CHECK (clicks >= 0),
    conversions     BIGINT NOT NULL DEFAULT 0 CHECK (conversions >= 0),
    user_id         INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at      TIMESTAMP WITH TIME ZONE DEFAULT NULL,

    CONSTRAINT valid_date_range CHECK (end_date >= start_date)
);

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX idx_campaigns_status     ON campaigns(status);
CREATE INDEX idx_campaigns_user_id    ON campaigns(user_id);
CREATE INDEX idx_campaigns_deleted_at ON campaigns(deleted_at);
CREATE INDEX idx_campaigns_start_date ON campaigns(start_date);
CREATE INDEX idx_users_email          ON users(email);

-- ============================================================
-- SEED DATA
-- ============================================================
-- Password: "admin123" (bcrypt hash)
INSERT INTO users (email, password_hash, name) VALUES
('admin@agency.com', '$2a$10$dI9zL3OsMZVCBPDE6dwIqwJtvC6M1lvnbniTFiNm0vv16', 'Admin User')
ON CONFLICT (email) DO NOTHING;

-- Sample campaigns (user_id = 1 assumes the admin user above)
INSERT INTO campaigns (name, description, status, budget, spend, start_date, end_date, impressions, clicks, conversions, user_id) VALUES
('Summer Sale 2025',        'Seasonal promotion for summer product line',           'active',    15000.00, 8750.50,  '2025-06-01', '2025-08-31', 450000, 12500, 890,  1),
('Brand Awareness Q3',      'Increase brand visibility across social platforms',    'active',    25000.00, 12300.00, '2025-07-01', '2025-09-30', 820000, 24000, 1560, 1),
('Product Launch — Widget X','Launch campaign for new Widget X product',            'paused',    50000.00, 22000.00, '2025-05-15', '2025-07-15', 1200000, 35000, 2800, 1),
('Holiday Promo 2024',      'Holiday season promotional campaign',                  'completed', 30000.00, 29500.00, '2024-11-15', '2024-12-31', 950000, 28000, 3200, 1),
('Spring Collection',       'Spring fashion collection digital campaign',           'active',    18000.00, 5200.00,  '2025-03-01', '2025-05-31', 320000, 9800,  620,  1),
('Retargeting — Cart Abandon','Retarget users who abandoned shopping carts',        'active',    8000.00,  3400.00,  '2025-04-01', '2025-06-30', 180000, 8500,  1100, 1),
('Influencer Collab Q2',    'Influencer partnership campaign for Q2',               'paused',    40000.00, 15000.00, '2025-04-01', '2025-06-30', 600000, 18000, 1400, 1),
('Email Re-engagement',     'Re-engage dormant email subscribers',                  'completed', 5000.00,  4800.00,  '2025-01-01', '2025-03-31', 120000, 6500,  950,  1),
('Mobile App Install',      'Drive mobile app installations via paid ads',          'active',    35000.00, 18000.00, '2025-05-01', '2025-07-31', 750000, 22000, 1800, 1),
('Video Campaign — YouTube','YouTube pre-roll and discovery ads',                   'active',    20000.00, 9200.00,  '2025-06-15', '2025-09-15', 500000, 15000, 980,  1)
ON CONFLICT DO NOTHING;
