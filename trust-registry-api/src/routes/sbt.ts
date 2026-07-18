import { Router } from 'express';
import { pool } from '../db';
import { z } from 'zod';

export const sbtRouter = Router();

const mintSchema = z.object({
  owner: z.string().length(44),
  issuer: z.string().length(44),
  sbt_type: z.number().int().min(0).max(4),
  token_id: z.string().or(z.number()),
  program_id: z.string().length(44),
  account_address: z.string().length(44),
  metadata_uri: z.string().url(),
  charter_reference: z.string(),
  risk_tier: z.number().int().min(0).max(3).optional(),
  expires_at: z.string().datetime().optional(),
});

sbtRouter.post('/mint', async (req, res) => {
  try {
    const data = mintSchema.parse(req.body);
    const result = await pool.query(
      `INSERT INTO sbt_registry (owner, issuer, sbt_type, token_id, program_id, account_address, metadata_uri, charter_reference, risk_tier, expires_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       ON CONFLICT (owner, sbt_type, token_id) DO UPDATE SET
         revoked = FALSE,
         metadata_uri = EXCLUDED.metadata_uri,
         updated_at = NOW()
       RETURNING *`,
      [data.owner, data.issuer, data.sbt_type, BigInt(data.token_id), data.program_id, data.account_address,
       data.metadata_uri, data.charter_reference, data.risk_tier || 0, data.expires_at || null]
    );
    res.json({ success: true, sbt: result.rows[0] });
  } catch (err) {
    res.status(400).json({ error: String(err) });
  }
});

sbtRouter.get('/:owner', async (req, res) => {
  const { owner } = req.params;
  const result = await pool.query(
    'SELECT * FROM sbt_registry WHERE owner = $1 AND revoked = FALSE',
    [owner]
  );
  res.json({ owner, sbts: result.rows });
});

sbtRouter.get('/:owner/:sbtType', async (req, res) => {
  const { owner, sbtType } = req.params;
  const result = await pool.query(
    'SELECT * FROM sbt_registry WHERE owner = $1 AND sbt_type = $2 AND revoked = FALSE',
    [owner, parseInt(sbtType)]
  );
  res.json({ owner, sbtType, sbts: result.rows });
});
