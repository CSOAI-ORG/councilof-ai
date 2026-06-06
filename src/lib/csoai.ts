/**
 * CSOAI Client — councilof-ai Vertical Integration
 */
import { CSOAI } from '@meok-labs/ai-sdk';

const API_BASE = process.env.NEXT_PUBLIC_CSOAI_API_URL || 'https://api.csoai.org';

export const csoai = CSOAI.create({
  baseUrl: API_BASE,
  vertical: 'councilofai',
  enableP2P: false,
  timeouts: { api: 30000, mcp: 60000, a2a: 45000, p2p: 30000 },
});

/** Ask the Policy Simulator Agent via A2A */
export async function askAgent(question: string) {
  const agentUrl = `${API_BASE}/a2a/councilofai`;
  return csoai.askAgent(agentUrl, question);
}

/** Fetch protocol health */
export async function fetchProtocolHealth() {
  const res = await csoai.api.get('/health');
  return res.data;
}
