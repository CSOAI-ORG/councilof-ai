import { Pool } from 'pg';

export const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'meok_registry',
  user: process.env.DB_USER || 'meok',
  password: process.env.DB_PASSWORD || 'meok',
});

export async function initDb() {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS sbt_registry (
        id SERIAL PRIMARY KEY,
        owner VARCHAR(44) NOT NULL,
        issuer VARCHAR(44) NOT NULL,
        sbt_type SMALLINT NOT NULL,
        token_id BIGINT NOT NULL,
        program_id VARCHAR(44) NOT NULL,
        account_address VARCHAR(44) NOT NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        expires_at TIMESTAMP,
        revoked BOOLEAN DEFAULT FALSE,
        metadata_uri TEXT,
        charter_reference VARCHAR(100),
        risk_tier SMALLINT DEFAULT 0,
        verification_hours BIGINT DEFAULT 0,
        UNIQUE(owner, sbt_type, token_id)
      )
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_owner ON sbt_registry(owner);
      CREATE INDEX IF NOT EXISTS idx_type ON sbt_registry(sbt_type);
      CREATE INDEX IF NOT EXISTS idx_charter ON sbt_registry(charter_reference);
    `);

    console.log('✅ Database initialized');
  } finally {
    client.release();
  }
}
