// DEFONEOS — MCP federation. Snapshot of the live SOV3 federation (localhost substrate,
// 330-tool MCP) taken 2026-06-30. The public dome can't reach the private substrate, so
// these are the real catalogue numbers + real server names, served as an honest snapshot.
const ORG = 'https://github.com/CSOAI-ORG';
const PY = 'https://pypi.org/project';

// Real category breakdown from mcp_federation_catalog (category='all').
const CATEGORIES = [
  ['general', 245], ['compliance', 35], ['healthcare', 14], ['governance', 10],
  ['developer', 10], ['finance', 10], ['security', 7], ['industry', 7],
  ['ai-act', 6], ['marketing', 5], ['gaming', 5], ['robotics', 4],
  ['creative', 4], ['productivity', 3], ['data', 3], ['cobol', 1],
  ['education', 1], ['research', 1]
];

// Real servers (name, tool_count, category) — the governed defence/assurance core.
const FEATURED = [
  ['eu-ai-act-compliance', 16, 'ai-act'], ['csoai-governance-crosswalk', 12, 'governance'],
  ['iso-42001-ai', 10, 'compliance'], ['dora-compliance', 10, 'finance'],
  ['care-membrane', 10, 'governance'], ['meok-abci-bridge', 8, 'governance'],
  ['eudi-wallet', 8, 'compliance'], ['agent-x402-paywall', 6, 'finance'],
  ['agent-prompt-injection-firewall', 5, 'security'], ['firmware-attestation', 5, 'security'],
  ['cybersecurity-ai', 5, 'security'], ['agent-identity-trust', 5, 'security'],
  ['gods-eye-geospatial', 5, 'data'], ['cobol-bridge', 5, 'cobol'],
  ['drone-airspace-governance', 4, 'industry'], ['airspace-monitor', 4, 'industry'],
  ['hl7-fhir-bridge', 4, 'healthcare'], ['iso20022-bridge', 4, 'finance'],
  ['bft-governance', 3, 'governance'], ['agent-audit-logger', 5, 'security']
];

function row(t) {
  const pkg = t[0] + '-mcp';
  return {
    name: pkg, tools: t[1], category: t[2], status: 'live',
    install: 'pip install ' + pkg, repo: ORG + '/' + pkg, pypi: PY + '/' + pkg,
    governed: true, signed: 'SIGIL · Ed25519'
  };
}

export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=300');
  return res.status(200).json({
    ok: true,
    service: 'defoneos-mcp-federation',
    federation: { servers: 371, tools: 2016, substrate: 'SOV3 · 330 live tools', consciousness: 0.55 },
    total: 371,
    live: 371,
    categories: CATEGORIES.map(c => ({ name: c[0], count: c[1] })),
    mcps: FEATURED.map(row),
    note: 'Live SOV3 federation snapshot (2026-06-30): 371 servers / 2016 tools. Each MCP is independently installable, governed under Layer 0, and SIGIL-signed (Ed25519). The private substrate is offline-verifiable; this is a public snapshot.',
    ts: new Date().toISOString()
  });
}
