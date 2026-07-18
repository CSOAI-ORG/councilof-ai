import { Router } from 'express';
import { pool } from '../db';

export const healthRouter = Router();

healthRouter.get('/', async (_req, res) => {
  try {
    const dbResult = await pool.query('SELECT NOW() as time');
    const sbtCount = await pool.query('SELECT COUNT(*) FROM sbt_registry');
    res.json({
      status: 'healthy',
      service: 'POAI Trust Registry',
      version: '1.0.0',
      timestamp: dbResult.rows[0].time,
      sbts_indexed: parseInt(sbtCount.rows[0].count),
      uptime: process.uptime(),
    });
  } catch (err) {
    res.status(500).json({ status: 'unhealthy', error: String(err) });
  }
});
