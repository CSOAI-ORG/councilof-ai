// THE canonical sovereign node graph — one source of truth every surface reads:
// the dock globe avatar, the MEOK Earth world (world.meok.ai), the force-graph, the
// browser extension. Add a node here and it lights up everywhere. CORS-open so any
// origin (incl. world.meok.ai) can fetch it.
//
// Grounded in the real MEOK estate: the legacy-bridge family + framework temples are
// placed across global hubs. Roles are the bridge/governance categories anchored at
// each city; status is the flywheel posture (governed = signed & adjudicated).

const NODES = [
  { id: 'london',    name: 'London',    lat: 51.5,  lon: -0.1,  status: 'governed', role: 'HQ · COBOL · ISO 20022 · CICS', kind: 'hq' },
  { id: 'newyork',   name: 'New York',  lat: 40.7,  lon: -74.0, status: 'governed', role: 'FIX · NACHA · ISO 8583 (trading & payments)', kind: 'finance' },
  { id: 'frankfurt', name: 'Frankfurt', lat: 50.1,  lon: 8.7,   status: 'governed', role: 'SAP · ACORD (enterprise & insurance)', kind: 'enterprise' },
  { id: 'tokyo',     name: 'Tokyo',     lat: 35.7,  lon: 139.7, status: 'governed', role: 'AS/400 · MQTT (manufacturing & IoT)', kind: 'industrial' },
  { id: 'singapore', name: 'Singapore', lat: 1.35,  lon: 103.8, status: 'governed', role: 'EDI · GS1 (trade & supply chain)', kind: 'trade' },
  { id: 'mumbai',    name: 'Mumbai',    lat: 19.1,  lon: 72.9,  status: 'governed', role: 'Oracle · tax bridges', kind: 'finance' },
  { id: 'dubai',     name: 'Dubai',     lat: 25.2,  lon: 55.3,  status: 'watch',    role: 'logistics & trade corridor', kind: 'trade' },
  { id: 'saopaulo',  name: 'São Paulo', lat: -23.5, lon: -46.6, status: 'governed', role: 'payments · NACHA-equiv', kind: 'finance' },
  { id: 'sydney',    name: 'Sydney',    lat: -33.9, lon: 151.2, status: 'governed', role: 'SCADA · DLMS (energy & utilities)', kind: 'industrial' },
  { id: 'toronto',   name: 'Toronto',   lat: 43.7,  lon: -79.4, status: 'governed', role: 'MISMO (mortgage) · insurance', kind: 'enterprise' },
  { id: 'hongkong',  name: 'Hong Kong', lat: 22.3,  lon: 114.2, status: 'governed', role: 'FIX · markets', kind: 'finance' },
  { id: 'capetown',  name: 'Cape Town', lat: -33.9, lon: 18.4,  status: 'watch',    role: 'HL7/FHIR health bridge (emerging)', kind: 'health' },
];

// the connector arcs (legacy → governed core)
const LINKS = [
  ['london', 'newyork'], ['london', 'frankfurt'], ['newyork', 'toronto'], ['newyork', 'saopaulo'],
  ['frankfurt', 'dubai'], ['singapore', 'tokyo'], ['singapore', 'hongkong'], ['mumbai', 'dubai'],
  ['tokyo', 'sydney'], ['london', 'capetown'], ['hongkong', 'tokyo'],
];

// Owner-editable WITHOUT a redeploy: set env NODES_URL to any JSON you control
// (a gist raw URL, a blob, an Edge Config endpoint) shaped { nodes:[...], links:[...] }.
// We fetch it at request time (5-min CDN cache), validate, and serve it instead of the
// baked-in base. Edit that file → it goes live on the next cache window. No deploy.
async function loadOverride() {
  const url = process.env.NODES_URL;
  if (!url || String(url).startsWith('REPLACE')) return null;
  try {
    const r = await fetch(url, { headers: { 'User-Agent': 'MEOK-nodes/1.0' } });
    if (!r.ok) return null;
    const d = await r.json();
    if (d && Array.isArray(d.nodes) && d.nodes.length) return d;
  } catch (e) { /* fall back to base */ }
  return null;
}

// Optional live flywheel snapshot (governed vs ungoverned) so the UI can colour the
// posture from real numbers. Owner sets FLYWHEEL_URL to a JSON the ingest engine writes.
async function loadFlywheel() {
  const url = process.env.FLYWHEEL_URL;
  if (!url || String(url).startsWith('REPLACE')) return null;
  try { const r = await fetch(url); if (r.ok) return await r.json(); } catch (e) {}
  return null;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Cache-Control', 'public, max-age=300');
  if (req.method === 'OPTIONS') return res.status(204).end();
  const override = await loadOverride();
  const flywheel = await loadFlywheel();
  const nodes = override ? override.nodes : NODES;
  const links = override ? (override.links || LINKS) : LINKS;
  return res.status(200).json({
    version: '1.0',
    source: 'os.meok.ai/api/nodes — canonical sovereign node graph',
    editable: !!process.env.NODES_URL,            // true once an owner override is wired
    legend: { governed: 'signed & council-adjudicated', watch: 'monitored', flagged: 'action required' },
    flywheel: flywheel || { governed: 0, ungoverned: 54300000, episodes: 649000000, live: false, source: 'SIGIL flywheel · 23 Jun 2026 snapshot' },   // canonical posture; live overrides when FLYWHEEL_URL is set
    count: nodes.length,
    nodes,
    links,
  });
}
