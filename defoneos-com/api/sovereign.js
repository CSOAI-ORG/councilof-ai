// Sovereign dock responder — same-origin so the chat WORKS for every visitor
// (the OS used to hit localhost:3101, dead off-box). This is an honest governed
// command-router + capability KB, NOT a live LLM. It routes, answers, or says so.
const KB = [
  { k:['who','what is defoneos','about','sovereign'], a:'DEFONEOS is the sovereign-grade operating substrate for defence AI — every action signed, every byte auditable, no foreign API calls. Audit-grade, neutral, AUKUS-compatible, powered by SOV3³.' },
  { k:['brain','sandwich','oowm','mind'], a:'12 sovereign brains run on the OOWM sandwich (Mamba → MoE → Attention → OOWM) under Layer 0 — care-floor ≥0.3, Ed25519-signed. Open the Sovereign Brains tile to choose yours.' },
  { k:['seal','verify','sigil'], a:'The DEFONEOS-SEAL is content-addressed + Ed25519-signable, anchored to the SIGIL audit chain. Verify it at /verify.html — the sovereign credential issues only on a logged 33-agent BFT vote (quorum 23/33).' },
  { k:['compartment','dagon','meok-defoneos','csoai-defoneos'], a:'Three compartments, never mixed: meok-defoneos (builds the 15 defence MCPs), csoai-defoneos (certifies via the 33-agent BFT council), dagon (legacy, NDA-only).' },
  { k:['dome','twin','3d','map','cop'], a:'The COP dome is a CesiumJS real-world 3D common operating picture — regulation/law layers, live threat/sensor/aircraft/seismic feeds, governed SOV SPACE simulation. Open it at /cop.html.' },
  { k:['ontology','graph','connections'], a:'The ontology map wires industries → data sources → MCPs → Layer-0 protocols → frameworks & law. Explore it at /ontology.html.' },
  { k:['bridge','cobol','legacy','fix','iso'], a:'22 legacy bridges connect the systems the world runs on — COBOL, FIX (trading), ISO 20022 (finance), HL7/FHIR, SCADA — each governed and SIGIL-logged.' },
  { k:['council','bft','vote'], a:'The 33-agent Byzantine-fault-tolerant council gates every sensitive action — quorum 23/33, tolerant to 11 adversarial nodes. No DEFONEOS-SEAL without a logged vote.' },
  { k:['compliance','jsp','eu ai act','nist','iso 42001','aukus','nato','law','regulation'], a:'Designed to align with UK JSP 936/440, EU AI Act Art 50, NIST AI RMF, ISO 42001, NATO AI Strategy — "designed to align", never a certification or partnership claim. See the regulation layer on the dome.' },
  { k:['pilot','price','cost','buy'], a:'Two pilot tiers: £5K evaluation (one sovereign twin, 3 MCPs, signed audit) and £25K programme (air-gap substrate, full 15-MCP suite, BFT council, DEFONEOS-SEAL path). Email nicholas@meok.ai.' }
];
const SCN = ['counter-drone','isr','medevac','swarm','cyber','flood','eod','comms'];

export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(204).end();
  let body = req.body; if (typeof body === 'string') { try { body = JSON.parse(body); } catch { body = {}; } }
  const q = String((body && (body.message || body.q)) || '').toLowerCase().trim();
  if (!q) return res.status(200).json({ response: 'Sovereign online. Ask about the dome, the 12 brains, the seal, compartments, bridges, the council, compliance, or pilots — or say "run counter-drone" / "status".', governed: true });

  let response, route = null;
  const scn = SCN.find(s => q.includes(s));
  if (q.includes('run') && scn) { response = 'Routing "' + scn + '" to SOV SPACE — open the dome (/cop.html) and it runs the governed scenario: sense → fuse → detect → council-gate → act → SIGIL receipt.'; route = { open: 'cop.html', sim: scn }; }
  else if (q.includes('status')) { response = 'SOV3³ substrate: 15 defence MCPs (13 live) · 33-agent BFT council, quorum 23 · 7-layer stack · 0 foreign API calls. Live feeds: USGS seismic + Coinbase markets. Manifest root a69df231…'; route = { open: 'cop.html' }; }
  else { const hit = KB.find(e => e.k.some(k => q.includes(k))); response = hit ? hit.a : 'I route commands and answer on DEFONEOS capabilities — the dome, 12 brains, the seal, compartments, bridges, the BFT council, compliance, pilots. Try "open the dome", "run counter-drone", or "status". (Honest: I\'m the governed dock responder, not a live LLM — the SOV3 brain runs on the sovereign node.)'; }
  return res.status(200).json({ response, route, governed: true, signed: 'SIGIL', ts: new Date().toISOString() });
}
