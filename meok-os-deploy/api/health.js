// Liveness + capability probe for THE shared sovereign backend (meok/csoai/defoneos).
// GET /api/health → what's live, so any surface can monitor it. CORS-open.
export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 'no-store');
  return res.status(200).json({
    ok: true,
    service: 'sovereign-backend',
    version: '3.0.0',
    surface_of: ['meok', 'csoai', 'defoneos'],
    brain: {
      openai_compat: '/api/v1/chat/completions',   // streaming + tools (DEFONEOS drop-in)
      orchestrator: '/api/orchestrate',            // {say, actions} + Care Floor
      groq: !!process.env.GROQ_API_KEY,
      anthropic: !!(process.env.ANTHROPIC_API_KEY && !String(process.env.ANTHROPIC_API_KEY).startsWith('REPLACE')),
    },
    tools: ['/api/sign', '/api/verify', '/api/bridge', '/api/govern', '/api/nodes', '/api/chat', '/api/knowledge', '/api/tools', '/api/media', '/api/badge', '/api/avatar', '/api/social'],
    governance: { care_floor: 0.95, sigil: 'ed25519', sigil_seeded: !!process.env.SIGIL_SEED },
    kit: '/sovereign-embed.js',
  });
}
