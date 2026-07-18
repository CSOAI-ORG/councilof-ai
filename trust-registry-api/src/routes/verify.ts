import { Router } from 'express';
import { pool } from '../db';

export const verifyRouter = Router();

verifyRouter.get('/:owner/:sbtType', async (req, res) => {
  const { owner, sbtType } = req.params;
  const startTime = Date.now();
  try {
    const result = await pool.query(
      `SELECT * FROM sbt_registry WHERE owner = $1 AND sbt_type = $2 AND revoked = FALSE
       AND (expires_at IS NULL OR expires_at > NOW())`,
      [owner, parseInt(sbtType)]
    );
    const valid = result.rows.length > 0;
    const sbt = valid ? result.rows[0] : null;
    res.json({
      valid, owner, sbt_type: parseInt(sbtType),
      sbt_type_name: ['AgentIdentity','SafetyCertification','VerifierReputation','CharacterGenesis','EnterpriseTrust'][parseInt(sbtType)],
      charter_reference: sbt?.charter_reference,
      risk_tier: sbt?.risk_tier,
      verification_hours: sbt?.verification_hours,
      metadata_uri: sbt?.metadata_uri,
      expires_at: sbt?.expires_at,
      response_time_ms: Date.now() - startTime,
    });
  } catch (err) {
    res.status(500).json({ valid: false, error: String(err) });
  }
});
