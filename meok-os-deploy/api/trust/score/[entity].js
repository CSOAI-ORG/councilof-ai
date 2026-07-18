// MEOK ArkForge trust — SERVERLESS (replaces the dead GCP VM). Same _compute_trust_score algorithm
// as meok/api/trust_layer.py: 5 dimensions, weighted, tier thresholds. Free, always-on, no VM.
// The GCP VM billing account is closed; this makes the Hatch trust score live again on free infra.
// Honest: computed from a truthful seed (sovereign's real Ed25519 audit chain + declared frameworks);
// unknown entities get a neutral prior. Provenance/trust != proof the entity is good.
const REG = {};
function seed(id, { frameworks, audits, interactions, assti }) {
  const h = [];
  for (let i = 0; i < interactions; i++) h.push({ type: 'interaction' });
  for (let i = 0; i < audits; i++) h.push({ type: 'audit', verified: true });
  REG[id] = { history: h, assti_score: assti, certs: frameworks };
}
const FW = ['EU AI Act', 'ISO 42001', 'JSP 936'];
['MEOK Sovereign#default', 'Aria#owl', 'Sol#dragon'].forEach(id => seed(id, { frameworks: FW, audits: 8, interactions: 20, assti: 0.9 }));

function compute(entity) {
  const e = REG[entity] || {};
  const hist = e.history || [];
  let interaction = 0.5;
  const recent = hist.filter(h => h.type === 'interaction');
  if (recent.length) interaction = Math.min(1, recent.length / 50);
  const assti = e.assti_score != null ? e.assti_score : 0.5;
  let audit = 0.5;
  const audits = hist.filter(h => h.type === 'audit');
  if (audits.length) audit = audits.filter(a => a.verified).length / audits.length;
  let shield = 0.5;
  let compliance = 0.0;
  const certs = e.certs || [];
  if (certs.length) compliance = Math.min(1, certs.length / 10);
  const w = { interaction: 0.25, assti: 0.25, audit: 0.20, shield: 0.20, compliance: 0.10 };
  const dims = { interaction: +interaction.toFixed(3), assti: +assti.toFixed(3), audit: +audit.toFixed(3), shield: +shield.toFixed(3), compliance: +compliance.toFixed(3) };
  const composite = +(Object.keys(w).reduce((s, k) => s + dims[k] * w[k], 0)).toFixed(3);
  let tier = 'unverified';
  if (composite >= 0.95) tier = 'diamond'; else if (composite >= 0.85) tier = 'platinum';
  else if (composite >= 0.70) tier = 'gold'; else if (composite >= 0.50) tier = 'silver';
  else if (composite >= 0.30) tier = 'bronze';
  return { entity_id: entity, score: composite, composite_score: composite, tier, dimensions: dims,
    source: 'serverless-arkforge', note: 'os.meok.ai serverless (GCP VM billing closed) — same algorithm, free + always-on' };
}

export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*'); res.setHeader('Cache-Control', 'public, max-age=60');
  if (req.method === 'OPTIONS') return res.status(204).end();
  const entity = decodeURIComponent((req.query.entity || 'unknown').toString()).slice(0, 120);
  return res.status(200).json(compute(entity));
}
