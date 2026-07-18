import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { sbtRouter } from './routes/sbt';
import { verifyRouter } from './routes/verify';
import { healthRouter } from './routes/health';
import { initDb } from './db';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3103;

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/v1/sbt', sbtRouter);
app.use('/api/v1/verify', verifyRouter);
app.use('/api/v1/health', healthRouter);

// POAI Verified badge widget endpoint
app.get('/api/v1/badge/:owner/:sbtType', async (req, res) => {
  const { owner, sbtType } = req.params;
  res.json({
    owner,
    sbtType,
    verified: true, // Placeholder — query Solana
    badge_url: `https://proofof.ai/badge/${owner}/${sbtType}`,
    svg: `<svg xmlns="http://www.w3.org/2000/svg" width="120" height="20"><rect fill="#00D4AA" width="120" height="20" rx="3"/><text fill="white" x="5" y="14" font-size="11">✓ POAI Verified</text></svg>`
  });
});

async function main() {
  await initDb();
  app.listen(PORT, () => {
    console.log(`🛡️  POAI Trust Registry running on port ${PORT}`);
    console.log(`   Health:  http://localhost:${PORT}/api/v1/health`);
    console.log(`   Verify:  http://localhost:${PORT}/api/v1/verify/:owner/:type`);
    console.log(`   Badge:   http://localhost:${PORT}/api/v1/badge/:owner/:type`);
  });
}

main().catch(console.error);
