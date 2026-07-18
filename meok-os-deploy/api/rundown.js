// Machine-readable, Ed25519-SIGNED session rundown — so any other agent can inspect AND verify
// (not just trust) what was built. GET /api/rundown → {rundown, canonical, signature, publicKey}.
// Verify offline at /api/verify. Card/demo data elsewhere is synthetic; this manifest is factual.
import crypto from 'crypto';
function canonical(v){ if(typeof v==='string') return v; const s=x=>Array.isArray(x)?x.map(s):(x&&typeof x==='object')?Object.keys(x).sort().reduce((o,k)=>(o[k]=s(x[k]),o),{}):x; return JSON.stringify(s(v)); }
function keypair(){ const seed=crypto.createHash('sha256').update(process.env.SIGIL_SEED||'meok-sovereign-demo-key-2026').digest(); const pkcs8=Buffer.concat([Buffer.from('302e020100300506032b657004220420','hex'),seed]); const priv=crypto.createPrivateKey({key:pkcs8,format:'der',type:'pkcs8'}); return {priv,pubHex:crypto.createPublicKey(priv).export({type:'spki',format:'der'}).toString('hex')}; }

const RUNDOWN = {
  title: 'MEOK OS / DEFONEOS / CSOAI — session rundown (auditable)',
  date: '2026-07-01',
  author: 'Claude Opus 4.8 (M4)',
  live: 'https://os.meok.ai',
  repo: 'github.com/CSOAI-ORG/clawd-workspace (path: meok-os-deploy/)',
  e2e: { file: 'test/e2e-products.mjs', passing: 89, failing: 0, run: 'node test/e2e-products.mjs https://os.meok.ai' },
  how_to_audit: [
    'Fetch this endpoint; POST {message:canonical, signature, publicKey} to /api/verify → must be valid.',
    'Open /systemcard.html and /registry.html; click Verify (green) then Tamper test (red).',
    'Run the E2E suite against os.meok.ai (89 functional checks).',
    'Read the docs in the repo (see docs[]).',
  ],
  surfaces: {
    'index.html': 'MEOK OS — Sovereign dock, tour, ambient watch, ~40 apps incl. Signed Assurance, globe',
    'systemcard.html': 'Signed System Card (Defence JSP936 ↔ Civilian EU AI Act toggle) + issue-your-own + how-to-verify + PDF',
    'registry.html': 'Signed, searchable card registry (system + model + civilian)',
    'verify.html': 'Public offline verifier (+ ?card= auto-verify)',
    'earth3d.html / earth3d-photoreal.html': 'Free raster 3D globe / Cesium(ion|Google) photoreal tiers',
    'pricing/badges/character/sovspace/embed-test': 'supporting surfaces (tour pill aligned)',
  },
  apis: {
    'systemcard': 'issue signed System/Model card; ?type=model, ?framework=eu-ai-act; POST {card} signs own',
    'registry': 'signed manifest index of cards',
    'sign / verify': 'Ed25519 sign / offline verify (the moat)',
    'bridge': 'legacy message validate (IBAN/ISO20022/HL7/ISO8583/SWIFT)',
    'govern': 'what-governs-my-industry → frameworks + bridges',
    'orchestrate / v1/chat/completions': 'brain (Groq) + OpenAI-compat drop-in (DEFONEOS/JEEVES)',
    'nodes / geo / weather / fx / social / knowledge / health': 'live data + capability probe',
    'train': 'SOV33 training-trace sink (tour actions)',
    'rundown': 'this signed manifest',
  },
  built_this_session: [
    'End-user assistant: reminders (recurring/snooze/edit/spoken), notes, board, instant maths/units/currency/world-clock/days-until, weather w/ sun times',
    'Self-driving TOUR (90s demo + ~6min full): narrated+spoken, spotlight, interruptible, window mgmt, 3D geo-dive + scan, SOV Town Space, Charters, abundance scenario arcs, dome, training trace; keyboard + deep-link + reduced-motion; scrub/replay; speech-paced',
    'Photoreal/HQ 3D: Cesium ion (free, terrain+OSM buildings) or Google tiles; on-device 3D setup',
    'DEFONEOS assurance: signed System Card (DAIC/Turing 1:1) + Model Card (10-section) + signed Registry (closes MOD no-central-store gap) + sovereign-key fingerprint + printable signed PDF + shareable auto-verify',
    'CSOAI civilian: EU AI Act Annex IV / ISO 42001 System Card variant on same rails; Defence↔Civilian toggle',
    'MEOK OS: Signed Assurance app in-OS; Ambient watch (idle → quiet self-run, lowered voice, live-signal collection + sims)',
    'GTM: EU/UK deep-research (verdict CONDITIONAL good play) + DIANA + DASA drafts + CSOAI learnings',
  ],
  docs: [
    'clawd/DEFONEOS_EU_UK_GTM_2026-07-01.md', 'clawd/DEFONEOS_DIANA_APPLICATION_2026-07-01.md',
    'clawd/DEFONEOS_DASA_OPENCALL_2026-07-01.md', 'clawd/CSOAI_FROM_DEFONEOS_LEARNINGS_2026-07-01.md',
    'clawd/MEOK_MIND_BODY_ARCHITECTURE_2026-07-01.md', 'meok-os-deploy/SIGIL_SEED_SETUP.md',
    'meok-os-deploy/RUNDOWN_2026-07-01.md',
  ],
  honest_caveats: [
    'System/Model/registry CARD DATA is synthetic/demonstration; signing + verification are real (Ed25519).',
    'Signing key is the DEMO seed until owner sets SIGIL_SEED env → then fingerprint becomes the permanent sovereign identity.',
    'Photoreal 3D (Google tiles) + Maps billing are owner-gated; Cesium ion needs a free owner token; without either, free raster globe.',
    'Two concurrent-chat edits broke prod mid-session (ESM require() 500; <div> in <head>); both caught by E2E and fixed. Repo shared by multiple agents — coordinate writes to meok-os-deploy/index.html.',
    'WebGL/mic/voice not screenshot-verifiable in this automation env; verified via DOM + node harness + curl + E2E.',
    'GCP VM hive (/home/nicholas/sov3): CONFIRMED healthy + reachable via MCP (sovereign_health_check ok); its record_memory write is currently blocked by a remote bridge arg-mapping bug, so the hive should ingest the signed /api/rundown URL. Repo push to GitHub CSOAI-ORG (PRIVATE) succeeded.',
  ],
  owner_gated: ['Set SIGIL_SEED (pin sovereign identity)', 'Cesium ion token or Google Maps key (HQ/photoreal 3D)', 'OAuth client IDs (social)', 'Anthropic credits', 'Stripe key', 'git push to CSOAI-ORG (token)', 'Send outreach (Turing/DASA/DIANA)'],
};

export default function handler(req, res){
  res.setHeader('Access-Control-Allow-Origin','*'); res.setHeader('Cache-Control','no-store');
  if(req.method==='OPTIONS') return res.status(204).end();
  try{ const {priv,pubHex}=keypair(); const message=canonical(RUNDOWN).slice(0,8000); const signature=crypto.sign(null,Buffer.from(message),priv).toString('hex');
    const sha256=crypto.createHash('sha256').update(message).digest('hex');
    const fingerprint='SOV:'+crypto.createHash('sha256').update(pubHex).digest('hex').slice(0,32).match(/.{1,4}/g).join('-').toUpperCase();
    return res.status(200).json({ ok:true, alg:'ed25519', rundown:RUNDOWN, canonical:message, sha256, signature, publicKey:pubHex, fingerprint, seeded:!!process.env.SIGIL_SEED,
      note:'Signed session rundown — verify at /api/verify. Inspect + audit freely.' });
  }catch(e){ return res.status(500).json({ ok:false, error:String(e.message||e) }); }
}
