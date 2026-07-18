-- King Runestone Portal — PostgreSQL schema
-- Production-grade persistence for sovereign runestones

CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(64) UNIQUE NOT NULL,
    sovereign_id VARCHAR(64) UNIQUE NOT NULL,
    password_hash VARCHAR(128) NOT NULL,
    nonce VARCHAR(64) NOT NULL,
    api_key VARCHAR(64) UNIQUE NOT NULL,
    created TIMESTAMPTZ DEFAULT NOW(),
    runestones_submitted INT DEFAULT 0,
    CONSTRAINT username_check CHECK (char_length(username) >= 3)
);

CREATE TABLE IF NOT EXISTS sessions (
    token VARCHAR(64) PRIMARY KEY,
    user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created TIMESTAMPTZ DEFAULT NOW(),
    expires TIMESTAMPTZ DEFAULT NOW() + INTERVAL '24 hours',
    ip_address INET,
    user_agent TEXT
);

CREATE TABLE IF NOT EXISTS runestones (
    id VARCHAR(64) PRIMARY KEY,
    sovereign_id VARCHAR(64) NOT NULL REFERENCES users(sovereign_id),
    mode VARCHAR(64) NOT NULL,
    query TEXT NOT NULL,
    response TEXT,
    sigil VARCHAR(64) UNIQUE NOT NULL,
    polyhedron VARCHAR(32),
    brain VARCHAR(32),
    voice VARCHAR(32),
    score REAL,
    passed BOOLEAN,
    voters_used INT DEFAULT 1,
    keystone VARCHAR(32) DEFAULT 'L6_keystone',
    created TIMESTAMPTZ DEFAULT NOW(),
    ledger_hash VARCHAR(64)  -- For chaining to next runestone
);

CREATE INDEX IF NOT EXISTS idx_runestones_sovereign ON runestones(sovereign_id);
CREATE INDEX IF NOT EXISTS idx_runestones_created ON runestones(created DESC);
CREATE INDEX IF NOT EXISTS idx_runestones_sigil ON runestones(sigil);
CREATE INDEX IF NOT EXISTS idx_runestones_mode ON runestones(mode);

CREATE TABLE IF NOT EXISTS sigil_chain (
    id SERIAL PRIMARY KEY,
    sigil VARCHAR(64) UNIQUE NOT NULL,
    prev_sigil VARCHAR(64),
    payload JSONB NOT NULL,
    created TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT chk_payload_attestation CHECK ((payload ? 'attestation'))
);

CREATE INDEX IF NOT EXISTS idx_sigil_chain_created ON sigil_chain(created DESC);

CREATE TABLE IF NOT EXISTS audit_trail (
    id BIGSERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id),
    runestone_id VARCHAR(64) REFERENCES runestones(id),
    action VARCHAR(64) NOT NULL,  -- 'submit', 'read', 'audit', 'login', 'logout'
    ip_address INET,
    user_agent TEXT,
    metadata JSONB DEFAULT '{}',
    created TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_user ON audit_trail(user_id, created DESC);

-- Materialized view: per-user stats
CREATE MATERIALIZED VIEW IF NOT EXISTS user_stats AS
SELECT
    u.sovereign_id,
    u.username,
    COUNT(r.id) AS total_runestones,
    SUM(CASE WHEN r.mode = '1-brain' THEN 1 ELSE 0 END) AS one_brain,
    SUM(CASE WHEN r.mode = '4-brain-parallel-12-voter' THEN 1 ELSE 0 END) AS four_brain,
    SUM(CASE WHEN r.mode = '4-brain-4-voice-3-voter' THEN 1 ELSE 0 END) AS four_x_four_x_three,
    SUM(r.voters_used) AS total_voters,
    AVG(r.score) AS avg_score,
    MAX(r.created) AS last_active
FROM users u
LEFT JOIN runestones r ON u.sovereign_id = r.sovereign_id
GROUP BY u.sovereign_id, u.username;

CREATE UNIQUE INDEX IF NOT EXISTS idx_user_stats ON user_stats(sovereign_id);
